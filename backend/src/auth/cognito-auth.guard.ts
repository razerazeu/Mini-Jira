import {
  CanActivate,
  ExecutionContext,
  Injectable,
  UnauthorizedException,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { Reflector } from '@nestjs/core';
import { Request } from 'express';
import jwt, { JwtHeader, SigningKeyCallback } from 'jsonwebtoken';
import { createPublicKey, JsonWebKey } from 'crypto';
import { AuthenticatedUser, CognitoTokenPayload } from './auth.types';
import { IS_PUBLIC_KEY } from './public.decorator';
import { DynamoDBService } from '../aws/dynamodb.service';
import { UserRole } from '../enums';

interface JwksResponse {
  keys: Array<JsonWebKey & { kid?: string }>;
}

@Injectable()
export class CognitoAuthGuard implements CanActivate {
  private readonly issuer: string;
  private readonly appClientId: string;
  private readonly jwksUri: string;
  private readonly publicKeys = new Map<string, string>();

  constructor(
    private readonly configService: ConfigService,
    private readonly reflector: Reflector,
    private readonly dynamoDBService: DynamoDBService,
  ) {
    const region = this.configService.getOrThrow<string>('AWS_REGION');
    const userPoolId =
      this.configService.getOrThrow<string>('COGNITO_USER_POOL_ID');

    this.appClientId =
      this.configService.get<string>('COGNITO_CLIENT_ID') ||
      this.configService.getOrThrow<string>('COGNITO_APP_CLIENT_ID');
    this.issuer = `https://cognito-idp.${region}.amazonaws.com/${userPoolId}`;
    this.jwksUri =
      this.configService.get<string>('COGNITO_JWKS_URL') ||
      `${this.issuer}/.well-known/jwks.json`;
  }

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const isPublic = this.reflector.getAllAndOverride<boolean>(IS_PUBLIC_KEY, [
      context.getHandler(),
      context.getClass(),
    ]);

    if (isPublic) {
      return true;
    }

    const request = context.switchToHttp().getRequest<Request>();
    const token = this.getBearerToken(request);

    if (!token) {
      throw new UnauthorizedException('Missing bearer token');
    }

    const payload = await this.verifyToken(token);
    this.assertExpectedClient(payload);
    request.user = await this.toAuthenticatedUser(payload);

    return true;
  }

  private getBearerToken(request: Request): string | null {
    const authorization = request.headers.authorization;

    if (!authorization) {
      return null;
    }

    const [scheme, token] = authorization.split(' ');
    if (scheme !== 'Bearer' || !token) {
      return null;
    }

    return this.normalizeBearerToken(token);
  }

  private verifyToken(token: string): Promise<CognitoTokenPayload> {
    return new Promise((resolve, reject) => {
      jwt.verify(
        token,
        this.getSigningKey,
        {
          issuer: this.issuer,
          algorithms: ['RS256'],
        },
        (error, decoded) => {
          if (error || !decoded || typeof decoded === 'string') {
            const reason = error?.message ? `: ${error.message}` : '';
            reject(new UnauthorizedException(`Invalid Cognito token${reason}`));
            return;
          }

          resolve(decoded as CognitoTokenPayload);
        },
      );
    });
  }

  private normalizeBearerToken(token: string) {
    const trimmed = token.trim();

    if (
      (trimmed.startsWith('"') && trimmed.endsWith('"')) ||
      (trimmed.startsWith("'") && trimmed.endsWith("'"))
    ) {
      return trimmed.slice(1, -1);
    }

    return trimmed;
  }

  private readonly getSigningKey = (
    header: JwtHeader,
    callback: SigningKeyCallback,
  ) => {
    if (!header.kid) {
      callback(new Error('Missing token key id'));
      return;
    }

    this.getPublicKey(header.kid)
      .then((publicKey) => callback(null, publicKey))
      .catch((error: Error) => callback(error));
  };

  private async getPublicKey(kid: string): Promise<string> {
    const cached = this.publicKeys.get(kid);
    if (cached) {
      return cached;
    }

    const response = await fetch(this.jwksUri);
    if (!response.ok) {
      throw new Error('Unable to fetch Cognito signing keys');
    }

    const jwks = (await response.json()) as JwksResponse;
    for (const key of jwks.keys) {
      if (!key.kid) {
        continue;
      }

      const publicKey = createPublicKey({
        key,
        format: 'jwk',
      }).export({
        format: 'pem',
        type: 'spki',
      }) as string;

      this.publicKeys.set(key.kid, publicKey);
    }

    const publicKey = this.publicKeys.get(kid);
    if (!publicKey) {
      throw new Error('Cognito signing key was not found');
    }

    return publicKey;
  }

  private assertExpectedClient(payload: CognitoTokenPayload) {
    const tokenClientId = payload.client_id || payload.aud;

    if (tokenClientId !== this.appClientId) {
      throw new UnauthorizedException('Token was issued for another client');
    }
  }

  private async toAuthenticatedUser(
    payload: CognitoTokenPayload,
  ): Promise<AuthenticatedUser> {
    const groups = payload['cognito:groups'] || [];
    const userRecord = this.needsUserRecord(payload)
      ? await this.getUserRecord(payload.sub)
      : null;

    return {
      userId: payload.sub,
      email: payload.email || userRecord?.email,
      name: payload.name || userRecord?.name,
      role:
        payload['custom:role'] ||
        userRecord?.role ||
        this.roleFromGroups(groups),
      teamId: payload['custom:teamId'] || userRecord?.teamId,
      groups,
      tokenUse: payload.token_use,
    };
  }

  private needsUserRecord(payload: CognitoTokenPayload) {
    return (
      !payload.email ||
      !payload.name ||
      !payload['custom:role'] ||
      !payload['custom:teamId']
    );
  }

  private async getUserRecord(userId: string) {
    const tableName = this.dynamoDBService.table('users');

    if (!tableName) {
      return null;
    }

    const result = await this.dynamoDBService.get({
      TableName: tableName,
      Key: { userId },
    });

    return result.Item ?? null;
  }

  private roleFromGroups(groups: string[]): UserRole | undefined {
    if (groups.some((group) => group.toUpperCase() === UserRole.MANAGER)) {
      return UserRole.MANAGER;
    }

    if (groups.some((group) => group.toUpperCase() === UserRole.EMPLOYEE)) {
      return UserRole.EMPLOYEE;
    }

    return undefined;
  }
}

import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import {
  AdminGetUserCommand,
  AdminUpdateUserAttributesCommand,
  AttributeType,
  CognitoIdentityProviderClient,
  GlobalSignOutCommand,
  InitiateAuthCommand,
  SignUpCommand,
} from '@aws-sdk/client-cognito-identity-provider';
import { UserRole } from '../enums';

export interface SignUpInput {
  email: string;
  password: string;
  name: string;
  role: UserRole;
  teamId?: string;
}

@Injectable()
export class CognitoService {
  private readonly client: CognitoIdentityProviderClient;
  private readonly appClientId: string;
  private readonly userPoolId: string;

  constructor(private readonly configService: ConfigService) {
    this.client = new CognitoIdentityProviderClient({
      region: this.configService.getOrThrow<string>('AWS_REGION'),
    });
    this.appClientId =
      this.configService.get<string>('COGNITO_CLIENT_ID') ||
      this.configService.getOrThrow<string>('COGNITO_APP_CLIENT_ID');
    this.userPoolId =
      this.configService.getOrThrow<string>('COGNITO_USER_POOL_ID');
  }

  signUp(input: SignUpInput) {
    return this.client.send(
      new SignUpCommand({
        ClientId: this.appClientId,
        Username: input.email,
        Password: input.password,
        UserAttributes: this.toUserAttributes(input),
      }),
    );
  }

  signIn(email: string, password: string) {
    return this.client.send(
      new InitiateAuthCommand({
        ClientId: this.appClientId,
        AuthFlow: 'USER_PASSWORD_AUTH',
        AuthParameters: {
          USERNAME: email,
          PASSWORD: password,
        },
      }),
    );
  }

  logout(accessToken: string) {
    return this.client.send(
      new GlobalSignOutCommand({
        AccessToken: accessToken,
      }),
    );
  }

  getUser(username: string) {
    return this.client.send(
      new AdminGetUserCommand({
        UserPoolId: this.userPoolId,
        Username: username,
      }),
    );
  }

  updateMembership(username: string, role: UserRole, teamId?: string) {
    return this.client.send(
      new AdminUpdateUserAttributesCommand({
        UserPoolId: this.userPoolId,
        Username: username,
        UserAttributes: this.toMembershipAttributes(role, teamId),
      }),
    );
  }

  private toUserAttributes(input: SignUpInput): AttributeType[] {
    return [
      { Name: 'email', Value: input.email },
      { Name: 'name', Value: input.name },
      ...this.toMembershipAttributes(input.role, input.teamId),
    ];
  }

  private toMembershipAttributes(
    role: UserRole,
    teamId?: string,
  ): AttributeType[] {
    const attributes: AttributeType[] = [
      { Name: 'custom:role', Value: role },
    ];

    if (teamId) {
      attributes.push({ Name: 'custom:teamId', Value: teamId });
    }

    return attributes;
  }
}

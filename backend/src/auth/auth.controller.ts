import {
  BadRequestException,
  Body,
  ConflictException,
  Controller,
  Post,
  Req,
  UnauthorizedException,
} from '@nestjs/common';
import type { Request } from 'express';
import { CognitoService } from './cognito.service';
import { SignInDto } from './dto/sign-in.dto';
import { SignUpDto } from './dto/sign-up.dto';
import { Public } from './public.decorator';
import { DynamoDBService } from '../aws/dynamodb.service';
import { NotificationStatus } from '../enums';

@Controller('auth')
export class AuthController {
  constructor(
    private readonly cognitoService: CognitoService,
    private readonly dynamoDBService: DynamoDBService,
  ) {}

  @Public()
  @Post('signup')
  async signUp(@Body() body: SignUpDto) {
    try {
      const result = await this.cognitoService.signUp(body);
      const userSub = result.UserSub;

      if (!userSub) {
        throw new BadRequestException('Cognito did not return a user id');
      }

      const now = new Date().toISOString();
      await this.dynamoDBService.put({
        TableName: this.dynamoDBService.table('users'),
        Item: {
          userId: userSub,
          name: body.name,
          email: body.email,
          role: body.role,
          teamId: body.teamId || null,
          teamName: null,
          snsSubscriptionArn: null,
          notificationStatus: 'PENDING' satisfies NotificationStatus,
          isActive: true,
          createdAt: now,
          updatedAt: now,
        },
        ConditionExpression: 'attribute_not_exists(userId)',
      });

      return {
        userSub,
        confirmed: result.UserConfirmed,
        delivery: result.CodeDeliveryDetails,
      };
    } catch (error) {
      this.handleCognitoError(error);
    }
  }

  @Public()
  @Post('signin')
  async signIn(@Body() body: SignInDto) {
    try {
      const result = await this.cognitoService.signIn(
        body.email,
        body.password,
      );

      return {
        challengeName: result.ChallengeName,
        session: result.Session,
        tokens: result.AuthenticationResult,
      };
    } catch (error) {
      this.handleCognitoError(error);
    }
  }

  @Post('logout')
  async logout(@Req() request: Request) {
    try {
      const accessToken = this.getBearerToken(request);
      await this.cognitoService.logout(accessToken);

      return {
        message: 'Logged out successfully',
      };
    } catch (error) {
      this.handleCognitoError(error);
    }
  }

  private handleCognitoError(error: unknown): never {
    const cognitoError = error as { name?: string; message?: string };

    if (cognitoError.name === 'UsernameExistsException') {
      throw new ConflictException('User already exists');
    }

    if (
      cognitoError.name === 'NotAuthorizedException' ||
      cognitoError.name === 'UserNotConfirmedException' ||
      cognitoError.name === 'UserNotFoundException'
    ) {
      throw new UnauthorizedException(cognitoError.message);
    }

    throw new BadRequestException(cognitoError.message || 'Cognito error');
  }

  private getBearerToken(request: Request): string {
    const authorization = request.headers.authorization;

    if (!authorization) {
      throw new UnauthorizedException('Missing bearer token');
    }

    const [scheme, token] = authorization.split(' ');
    if (scheme !== 'Bearer' || !token) {
      throw new UnauthorizedException('Missing bearer token');
    }

    return token;
  }
}

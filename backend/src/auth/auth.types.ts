import { UserRole } from '../enums';

export interface AuthenticatedUser {
  userId: string;
  email?: string;
  name?: string;
  role?: UserRole;
  teamId?: string;
  groups: string[];
  tokenUse: 'access' | 'id';
}

export interface CognitoTokenPayload {
  sub: string;
  email?: string;
  name?: string;
  'custom:role'?: UserRole;
  'custom:teamId'?: string;
  'cognito:groups'?: string[];
  token_use: 'access' | 'id';
  iss: string;
  aud?: string;
  client_id?: string;
  exp: number;
  iat: number;
}

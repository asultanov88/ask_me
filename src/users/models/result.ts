import { ProviderDetails } from 'src/providers/models/result';

export interface UserResult {
  userId: number;
  firstName: string;
  lastName: string;
  email: string;
  createdAt: string;
  isClient: boolean;
  isProvider: boolean;
  provider: ProviderDetails;
}

export class AuthUserResult {
  userId: number;
  firstName: string;
  lastName: string;
  email: string;
  password: string;
  createdAt: string;
  inactive: string;
  isClient: boolean;
  isProvider: boolean;
  clientId: number;
  providerId: number;
}

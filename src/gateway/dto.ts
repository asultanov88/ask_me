import { AuthorisedUser } from 'src/auth/models/dto';

export interface SocketMessageDto {
  message: string;
  toUserId: number;
  accessToken: string;
  user: AuthorisedUser;
}

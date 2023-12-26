import { AuthorisedUser } from 'src/auth/models/dto';

export interface SocketMessageDto {
  message: string;
  accessToken: string;
  user: AuthorisedUser;
}

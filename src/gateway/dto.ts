import { AuthorisedUser } from 'src/auth/models/dto';

export interface SocketMessageDto {
  subjectId: number;
  message: string;
  toUserId: number;
  accessToken: string;
  user: AuthorisedUser;
}

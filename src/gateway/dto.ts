import { AuthorisedUser } from 'src/auth/models/dto';

export interface SocketMessageDto {
  subjectId: number;
  message: string;
  toUserId: number;
  accessToken: string;
  user: AuthorisedUser;
}

export interface PostedMessage {
  messageId: number;
  message: string;
  error: string;
}

export interface ViewedMessage {
  accessToken: string;
  messageId: number;
}

import { AuthorisedUser } from 'src/auth/models/dto';
import { Message } from 'src/messages/model/result/result';

export interface SocketMessageDto {
  subjectId: number;
  message: string;
  toUserId: number;
  accessToken: string;
  user: AuthorisedUser;
}

export interface PostedMessage extends Message {
  error: string;
}

export interface ViewedMessage {
  accessToken: string;
  messageId: number;
}

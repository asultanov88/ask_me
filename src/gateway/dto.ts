import { AuthorisedUser } from 'src/auth/models/dto';
import { Message } from 'src/messages/model/result/result';

export interface SocketMessageDto {
  subjectId: number;
  replyToMessageId: number;
  message: string;
  isAttachment: boolean;
  toUserId: number;
  accessToken: string;
  user: AuthorisedUser;
}

export interface OutgoingAttachmentMessageDto {
  toUserId: number;
  message: PostedMessage;
}

export interface PostedMessage extends Message {
  subjectId: number;
  error: string;
}

export interface ReplyToMessage {
  replyToMessageId: number;
  replyToMessage: string;
  replyDateTime: string;
}

export interface ViewedMessage {
  accessToken: string;
  messageId: number;
}

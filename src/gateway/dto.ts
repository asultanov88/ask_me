import { AuthorisedUser } from 'src/auth/models/dto';
import { Message } from 'src/messages/model/result/result';

export interface UpdateMessageDto {
  messageId: number;
  message: string;
}

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

export interface UpdatedMessage {
  clientUserId: number;
  providerUserId: number;
  postedMessage: PostedMessage;
}

export interface PostedMessage extends Message {
  subjectId: number;
  error: string;
}

export interface ReplyToMessage {
  replyToMessageId: number;
  replyToMessage: string;
  originalMessageCreatedBy: number;
  thumbnailUrl: string;
  attachmentOriginalName: string;
}

export interface ViewedMessage {
  accessToken: string;
  messageId: number;
}

export interface MessageRecipients {
  clientUserId: number;
  providerUserId: number;
}

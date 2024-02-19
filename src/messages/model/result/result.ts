import { MessageHistory, ReplyToMessage } from 'src/gateway/dto';

export interface ClientProviderMessage {
  subjectId: number;
  title: string;
  newMessageCount: number;
}

export interface Attachment {
  messageAttachmentId: number;
  attachmentOriginalName: string;
  attachmentMimeType: string;
  attachmentThumbnailId: number;
  thumbnailUrl?: string;
}

export interface MessageById extends Message {
  subjectId: number;
}

export interface Message {
  messageId: number;
  message: string;
  isAttachment: boolean;
  createdBy: number;
  createdAt: string;
  lastUpdatedAt: string;
  viewed: boolean;
  attachments: Attachment[];
  replyToMessage: ReplyToMessage;
  messageHistory: MessageHistory[];
}

export interface MessageViewed {
  messageId: number;
  clientUserId: number;
  providerUserId: number;
}

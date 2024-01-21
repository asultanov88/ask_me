export interface ClientProviderMessage {
  subjectId: number;
  title: string;
  newMessageCount: number;
}

export interface Attachment {
  messageAttachmentId: number;
}

export interface Message {
  messageId: number;
  message: string;
  isAttachment: boolean;
  createdBy: number;
  createdAt: string;
  viewed: boolean;
  attachments: Attachment[];
}

export interface MessageViewed {
  messageId: number;
  clientUserId: number;
  providerUserId: number;
}

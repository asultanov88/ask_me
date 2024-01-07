export interface ClientProviderMessage {
  subjectId: number;
  title: string;
  newMessageCount: number;
}

export interface Message {
  messageId: number;
  message: string;
  createdBy: number;
  viewed: boolean;
}
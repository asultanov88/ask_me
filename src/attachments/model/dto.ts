export interface AttachmentMessageDto {
  subjectId: number;
  message: string;
  isAttachment: boolean;
  toUserId: number;
}

export class MessageAttachmentDto {
  messageAttachmentId: number;
  messageId: number;
  originalName: string;
  mimeType: string;
  uuid: string;
  s3Key: string;
  s3Bucket: string;
  location: string;
}

export class AttachmentThumbnailDto {
  attachmentThumbnailId: number;
  messageAttachmentId: number;
  mimeType: string;
  uuid: string;
  s3Key: string;
  s3Bucket: string;
  location: string;
}

export interface ThumbnailIds {
  thumbnailIdArr: number[];
}

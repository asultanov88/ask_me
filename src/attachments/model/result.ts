export interface MessageAttachmentResult {
  messageAttachmentId: number;
  messageId: number;
  originalName: string;
  uuid: string;
  s3Key: string;
  s3Bucket: string;
}

export interface AttachmentThumbnailResult {
  attachmentThumbnailId: number;
  messageAttachmentId: number;
  uuid: string;
  s3Key: string;
  s3Bucket: string;
  location: string;
}

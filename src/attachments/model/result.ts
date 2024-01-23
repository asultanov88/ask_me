export interface MessageAttachmentResult {
  messageAttachmentId: number;
  messageId: number;
  originalName: string;
  uuid: string;
  s3Key: string;
  s3Bucket: string;
}

export interface MessageAttachmentWithThumbnailResult
  extends MessageAttachmentResult {
  attachmentThumbnailId: number;
}

export interface AttachmentThumbnailResult {
  attachmentThumbnailId: number;
  messageAttachmentId: number;
  mimeType: string;
  uuid: string;
  s3Key: string;
  s3Bucket: string;
  location: string;
}

export interface ThumbnailObject extends AttachmentThumbnailResult {
  thumbnailUrl?: string;
}

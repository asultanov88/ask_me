import { IsInt, IsNotEmpty, IsString, Min } from 'class-validator';

export class MessageAttachmentDto {
  messageAttachmentId: number;
  messageId: number;
  originalName: string;
  uuid: string;
  s3Key: string;
  s3Bucket: string;
  location: string;
}

export class MessageDto {
  messageId: number;

  @IsNotEmpty()
  @IsString()
  message: string;

  isAttachment: boolean;

  createdBy: number;

  createdAt: string;

  viewed: boolean;
}

export class NewMessage {
  @IsNotEmpty()
  @IsInt()
  @Min(1)
  subjectId: number;

  @IsNotEmpty()
  @IsString()
  message: string;

  isAttachment: boolean;
}

export class SubjectDto {
  subjectId: number;

  @IsNotEmpty()
  @IsInt()
  @Min(1)
  providerId: number;

  @IsNotEmpty()
  @IsString()
  title: string;

  deleted: number;
}

import {
  IsInstance,
  IsInt,
  IsNotEmpty,
  IsString,
  Min,
  ValidateIf
} from 'class-validator';

export class MessageDto {
  messageId: number;

  @IsNotEmpty()
  @IsString()
  message: string;

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

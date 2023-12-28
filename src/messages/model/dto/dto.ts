import { IsInt, IsNotEmpty, IsString } from 'class-validator';

export class SubjectDto {
  subjectId: number;

  @IsNotEmpty()
  @IsInt()
  providerId: number;

  clientId: number;

  @IsNotEmpty()
  @IsString()
  title: string;

  deleted: number;
}

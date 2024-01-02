import { IsInt, IsNotEmpty, IsString, Min, ValidateIf } from 'class-validator';

export class SubjectDto {
  subjectId: number;

  @ValidateIf(
    (val) =>
      val.providerId === null ||
      val.providerId === undefined ||
      val.providerId === 0
  )
  @IsNotEmpty()
  @IsInt()
  clientProviderId: number;

  @ValidateIf(
    (val) =>
      val.clientProviderId === null ||
      val.clientProviderId === undefined ||
      val.clientProviderId === 0
  )
  @IsNotEmpty()
  @IsInt()
  @Min(1)
  providerId: number;

  @IsNotEmpty()
  @IsString()
  title: string;

  deleted: number;
}

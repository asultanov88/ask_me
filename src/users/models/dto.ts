import {
  IsEmail,
  IsInt,
  IsNotEmpty,
  Max,
  Min,
  ValidateIf
} from 'class-validator';

export class UserDto {
  userId: number = null;

  @IsNotEmpty()
  firstName: string = null;

  @IsNotEmpty()
  lastName: string = null;

  @IsEmail()
  email: string = null;

  @IsNotEmpty()
  password: string = null;

  createdAt: string = null;

  inactive: string = null;

  @ValidateIf((o) => o.isProvider === 0)
  @IsNotEmpty()
  @IsInt()
  @Min(1)
  @Max(1)
  isClient: number = 0;

  @ValidateIf((o) => o.isClient === 0)
  @IsNotEmpty()
  @IsInt()
  @Min(1)
  @Max(1)
  isProvider: number = 0;
}

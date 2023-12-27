import {
  IsBoolean,
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

  @IsBoolean()
  isClient: boolean = false;

  @IsBoolean()
  isProvider: boolean = false;
}

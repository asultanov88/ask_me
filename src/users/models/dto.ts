import { IsEmail, IsNotEmpty, IsNumber, IsString } from 'class-validator';

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
}

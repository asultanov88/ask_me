import { IsEmail, IsNotEmpty, IsNumber, IsString } from 'class-validator';

export class UserDto {
  UserId: number = null;

  @IsNotEmpty()
  FirstName: string = null;

  @IsNotEmpty()
  LastName: string = null;

  @IsEmail()
  Email: string = null;

  @IsNotEmpty()
  Password: string = null;

  CreatedAt: string = null;

  Inactive: string = null;
}

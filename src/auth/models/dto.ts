import { IsEmail, IsNotEmpty } from 'class-validator';

export class UserLogin {
  @IsEmail()
  Email: string;

  @IsNotEmpty()
  Password: string;
}

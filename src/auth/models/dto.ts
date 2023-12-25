import { IsEmail, IsNotEmpty } from 'class-validator';

export class UserLogin {
  @IsEmail()
  email: string;

  @IsNotEmpty()
  password: string;
}

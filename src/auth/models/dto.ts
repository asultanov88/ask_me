import { IsEmail, IsNotEmpty } from 'class-validator';

export class UserLogin {
  @IsEmail()
  email: string;

  @IsNotEmpty()
  password: string;
}

export class AuthorisedUser {
  userId: number;
  username: string;
  iat: number;
  exp: number;
  socketClientId;
}

import { IsEmail, IsNotEmpty, IsString } from 'class-validator';

export class UserLogin {
  @IsEmail()
  email: string;

  @IsNotEmpty()
  password: string;
}

export class RefreshToken {
  @IsNotEmpty()
  @IsString()
  accessToken: string;
}

export class AuthorisedUser {
  userId: number;
  username: string;
  iat: number;
  exp: number;
  socketClientId;
}

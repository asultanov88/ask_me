import { Injectable, UnauthorizedException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { DatabaseEntity } from 'src/database/entities/database';
import { MsSql } from 'src/database/typeorm/mssql';
import { Repository } from 'typeorm';
import { UsersService } from 'src/users/users.service';
import { UserLogin } from './models/dto';
import * as bcrypt from 'bcrypt';
import { JwtService } from '@nestjs/jwt';
import { AuthUserResult } from 'src/users/models/result';

@Injectable()
export class AuthService {
  constructor(
    @InjectRepository(DatabaseEntity)
    private database: Repository<null>,
    private mssql: MsSql,
    private readonly userService: UsersService,
    private readonly jwtService: JwtService
  ) {}

  // Authenticates user login.
  async login(userLogin: UserLogin): Promise<any> {
    const user: AuthUserResult = await this.userService.getUserByEmail(
      userLogin.email
    );

    if (
      userLogin.password &&
      user &&
      user.password ===
        (await bcrypt.hash(userLogin.password, process.env.SALT_KEY))
    ) {
      const payload = { userId: user.userId, username: user.email };
      if (user.isClient) {
        payload['clientId'] = user.clientId;
      }
      if (user.isProvider) {
        payload['providerId'] = user.providerId;
      }

      return {
        accessToken: await this.jwtService.signAsync(payload)
      };
    } else {
      throw new UnauthorizedException();
    }
  }
}

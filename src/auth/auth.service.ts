import { Inject, Injectable, UnauthorizedException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { DatabaseEntity } from 'src/database/entities/database';
import { MsSql } from 'src/database/typeorm/mssql';
import { Repository } from 'typeorm';
import { UsersService } from 'src/users/users.service';
import { RefreshToken, UserLogin } from './models/dto';
import * as bcrypt from 'bcrypt';
import { JwtService } from '@nestjs/jwt';
import { AuthUserResult } from 'src/users/models/result';
import { REQUEST } from '@nestjs/core';

@Injectable()
export class AuthService {
  constructor(
    @InjectRepository(DatabaseEntity)
    private database: Repository<null>,
    private mssql: MsSql,
    private readonly userService: UsersService,
    private readonly jwtService: JwtService,
    @Inject(REQUEST) private readonly request: Request
  ) {}

  async refresh(accessToken: string): Promise<any> {
    try {
      const payload = await this.jwtService.verifyAsync(accessToken, {
        secret: process.env.JWT_KEY,
        ignoreExpiration: true
      });

      if (payload) {
        const userEmail = payload.username;
        const user: AuthUserResult =
          await this.userService.getUserByEmail(userEmail);
        const refreshedPayload = { userId: user.userId, username: user.email };
        if (user.isClient) {
          refreshedPayload['clientId'] = user.clientId;
        }
        if (user.isProvider) {
          refreshedPayload['providerId'] = user.providerId;
        }

        // Remove password property from user object.
        delete user.password;

        return {
          accessToken: await this.jwtService.signAsync(refreshedPayload),
          user: user
        };
      }
    } catch (error) {
      throw new UnauthorizedException();
    }
  }

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

      // Remove password property from user object.
      delete user.password;

      return {
        accessToken: await this.jwtService.signAsync(payload),
        user: user
      };
    } else {
      throw new UnauthorizedException();
    }
  }
}

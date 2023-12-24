import { Injectable, UnauthorizedException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { DatabaseEntity } from 'src/database/entities/database';
import { MsSql } from 'src/database/typeorm/mssql';
import { Repository } from 'typeorm';
import { UsersService } from 'src/users/users.service';
import { UserLogin } from './models/dto';
import { UserDto } from 'src/users/models/dto';
import * as bcrypt from 'bcrypt';
import { JwtService } from '@nestjs/jwt';

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
    const user: UserDto = await this.userService.getUserByEmail(
      userLogin.Email
    );

    if (
      userLogin.Password &&
      user &&
      user.Password ===
        (await bcrypt.hash(userLogin.Password, process.env.SALT_KEY))
    ) {
      const payload = { sub: user.UserId, username: user.Email };
      return {
        access_token: await this.jwtService.signAsync(payload)
      };
    } else {
      throw new UnauthorizedException();
    }
  }
}

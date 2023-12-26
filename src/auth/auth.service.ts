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
      userLogin.email
    );

    if (
      userLogin.password &&
      user &&
      user.password ===
        (await bcrypt.hash(userLogin.password, process.env.SALT_KEY))
    ) {
      const payload = { userId: user.userId, username: user.email };
      return {
        accessToken: await this.jwtService.signAsync(payload)
      };
    } else {
      throw new UnauthorizedException();
    }
  }
}

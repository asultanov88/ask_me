import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { DatabaseEntity } from 'src/database/entities/database';
import { MsSql } from 'src/database/typeorm/mssql';
import { Repository } from 'typeorm';
import { UsersService } from 'src/users/users.service';
import { UserLogin } from './models/dto';
import { UserDto } from 'src/users/models/dto';
import * as bcrypt from 'bcrypt';

@Injectable()
export class AuthService {
  constructor(
    @InjectRepository(DatabaseEntity)
    private database: Repository<null>,
    private mssql: MsSql,
    private readonly userService: UsersService
  ) {}

  async login(userLogin: UserLogin): Promise<any> {
    const user: UserDto = await this.userService.getUserByEmail(
      userLogin.email
    );
    if (
      user.Password ===
      (await bcrypt.hash(userLogin.password, process.env.SALT_KEY))
    ) {
      console.log('success');
    }
  }
}

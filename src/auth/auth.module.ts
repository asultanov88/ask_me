import { Module } from '@nestjs/common';
import { AuthService } from './auth.service';
import { AuthController } from './auth.controller';
import { MsSql } from 'src/database/typeorm/mssql';
import { TypeOrmModule } from '@nestjs/typeorm';
import { DatabaseEntity } from 'src/database/entities/database';
import { ErrorHandler } from 'src/Helper/ErrorHandler';
import { UsersService } from 'src/users/users.service';

@Module({
  imports: [TypeOrmModule.forFeature([DatabaseEntity])],
  providers: [MsSql, ErrorHandler, AuthService, UsersService],
  controllers: [AuthController],
  exports: [AuthService]
})
export class AuthModule {}

import { Module } from '@nestjs/common';
import { AuthService } from './auth.service';
import { AuthController } from './auth.controller';
import { MsSql } from 'src/database/typeorm/mssql';
import { TypeOrmModule } from '@nestjs/typeorm';
import { DatabaseEntity } from 'src/database/entities/database';
import { ErrorHandler } from 'src/Helper/ErrorHandler';
import { UsersService } from 'src/users/users.service';
import { JwtModule, JwtService } from '@nestjs/jwt';

@Module({
  imports: [
    TypeOrmModule.forFeature([DatabaseEntity]),
    JwtModule.register({
      global: true,
      secret: process.env.JWT_KEY,
      signOptions: { expiresIn: '60m' }
    })
  ],
  providers: [MsSql, ErrorHandler, AuthService, UsersService],
  controllers: [AuthController],
  exports: [AuthService]
})
export class AuthModule {}

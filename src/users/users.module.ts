import { Module } from '@nestjs/common';
import { UsersService } from './users.service';
import { UsersController } from './users.controller';
import { TypeOrmModule } from '@nestjs/typeorm';
import { DatabaseEntity } from 'src/database/entities/database';
import { MsSql } from 'src/database/typeorm/mssql';
import { ErrorHandler } from 'src/Helper/ErrorHandler';

@Module({
  imports: [TypeOrmModule.forFeature([DatabaseEntity])],
  providers: [MsSql, ErrorHandler, UsersService],
  exports: [UsersService],
  controllers: [UsersController]
})
export class UsersModule {}

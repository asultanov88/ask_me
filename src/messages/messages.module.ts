import { Module } from '@nestjs/common';
import { MessagesController } from './messages.controller';
import { MessagesService } from './messages.service';
import { TypeOrmModule } from '@nestjs/typeorm';
import { DatabaseEntity } from 'src/database/entities/database';
import { MsSql } from 'src/database/typeorm/mssql';
import { ErrorHandler } from 'src/Helper/ErrorHandler';

@Module({
  imports: [TypeOrmModule.forFeature([DatabaseEntity])],
  controllers: [MessagesController],
  providers: [MsSql, ErrorHandler, MessagesService],
  exports: [MessagesService]
})
export class MessagesModule {}

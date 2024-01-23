import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ErrorHandler } from 'src/Helper/ErrorHandler';
import { AttachmentsService } from 'src/attachments/attachments.service';
import { DatabaseEntity } from 'src/database/entities/database';
import { MsSql } from 'src/database/typeorm/mssql';
import { MessagesController } from './messages.controller';
import { MessagesService } from './messages.service';

@Module({
  imports: [TypeOrmModule.forFeature([DatabaseEntity])],
  controllers: [MessagesController],
  providers: [MsSql, ErrorHandler, MessagesService, AttachmentsService],
  exports: [MessagesService]
})
export class MessagesModule {}

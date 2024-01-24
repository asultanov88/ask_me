import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ErrorHandler } from 'src/Helper/ErrorHandler';
import { DatabaseEntity } from 'src/database/entities/database';
import { MsSql } from 'src/database/typeorm/mssql';
import { MessagesService } from 'src/messages/messages.service';
import { AttachmentsController } from './attachments.controller';
import { AttachmentsService } from './attachments.service';

@Module({
  imports: [TypeOrmModule.forFeature([DatabaseEntity])],
  controllers: [AttachmentsController],
  providers: [MsSql, ErrorHandler, AttachmentsService, MessagesService],
  exports: [AttachmentsService]
})
export class AttachmentsModule {}

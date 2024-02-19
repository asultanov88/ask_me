import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ErrorHandler } from 'src/Helper/ErrorHandler';
import { CommonService } from 'src/common/common.service';
import { DatabaseEntity } from 'src/database/entities/database';
import { MsSql } from 'src/database/typeorm/mssql';
import { AttachmentsController } from './attachments.controller';
import { AttachmentsService } from './attachments.service';

@Module({
  imports: [TypeOrmModule.forFeature([DatabaseEntity])],
  controllers: [AttachmentsController],
  providers: [MsSql, ErrorHandler, AttachmentsService, CommonService],
  exports: [AttachmentsService]
})
export class AttachmentsModule {}

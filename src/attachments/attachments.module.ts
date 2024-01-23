import { Module } from '@nestjs/common';
import { AttachmentsService } from './attachments.service';
import { AttachmentsController } from './attachments.controller';
import { TypeOrmModule } from '@nestjs/typeorm';
import { DatabaseEntity } from 'src/database/entities/database';
import { MsSql } from 'src/database/typeorm/mssql';
import { ErrorHandler } from 'src/Helper/ErrorHandler';
import { S3 } from 'aws-sdk';
import { GatewayService } from 'src/gateway/gateway.service';

@Module({
  imports: [TypeOrmModule.forFeature([DatabaseEntity])],
  controllers: [AttachmentsController],
  providers: [MsSql, ErrorHandler, AttachmentsService],
  exports: [AttachmentsService]
})
export class AttachmentsModule {}

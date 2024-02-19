import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ErrorHandler } from 'src/Helper/ErrorHandler';
import { DatabaseEntity } from 'src/database/entities/database';
import { MsSql } from 'src/database/typeorm/mssql';
import { MessagesController } from 'src/messages/messages.controller';
import { CommonService } from './common.service';

@Module({
  imports: [TypeOrmModule.forFeature([DatabaseEntity])],
  controllers: [MessagesController],
  providers: [MsSql, ErrorHandler, CommonService],
  exports: [CommonService]
})
export class CommonModule {}

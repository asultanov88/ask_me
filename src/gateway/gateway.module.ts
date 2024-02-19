import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ErrorHandler } from 'src/Helper/ErrorHandler';
import { CommonService } from 'src/common/common.service';
import { DatabaseEntity } from 'src/database/entities/database';
import { MsSql } from 'src/database/typeorm/mssql';
import { Gateway } from './gateway';
import { GatewayService } from './gateway.service';

@Module({
  imports: [TypeOrmModule.forFeature([DatabaseEntity])],
  providers: [Gateway, GatewayService, MsSql, ErrorHandler, CommonService]
})
export class GatewayModule {}

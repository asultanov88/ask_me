import { Module } from '@nestjs/common';
import { Gateway } from './gateway';
import { GatewayService } from './gateway.service';
import { MsSql } from 'src/database/typeorm/mssql';
import { TypeOrmModule } from '@nestjs/typeorm';
import { DatabaseEntity } from 'src/database/entities/database';
import { ErrorHandler } from 'src/Helper/ErrorHandler';

@Module({
  imports: [TypeOrmModule.forFeature([DatabaseEntity])],
  providers: [Gateway, GatewayService, MsSql, ErrorHandler]
})
export class GatewayModule {}

import { Module } from '@nestjs/common';
import { ProvidersController } from './providers.controller';
import { ProvidersService } from './providers.service';
import { DatabaseEntity } from 'src/database/entities/database';
import { TypeOrmModule } from '@nestjs/typeorm';
import { MsSql } from 'src/database/typeorm/mssql';
import { ErrorHandler } from 'src/Helper/ErrorHandler';

@Module({
  imports: [TypeOrmModule.forFeature([DatabaseEntity])],
  controllers: [ProvidersController],
  providers: [MsSql, ErrorHandler, ProvidersService],
  exports: [ProvidersService]
})
export class ProvidersModule {}

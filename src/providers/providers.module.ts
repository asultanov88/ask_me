import { Module } from '@nestjs/common';
import { ProvidersController } from './providers.controller';
import { ProvidersService } from './providers.service';
import { DatabaseEntity } from 'src/database/entities/database';
import { TypeOrmModule } from '@nestjs/typeorm';
import { MsSql } from 'src/database/typeorm/mssql';

@Module({
  imports: [TypeOrmModule.forFeature([DatabaseEntity])],
  controllers: [ProvidersController],
  providers: [MsSql, ProvidersService]
})
export class ProvidersModule {}

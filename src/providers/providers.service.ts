import { Injectable, Provider } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { DatabaseEntity } from 'src/database/entities/database';
import { Repository } from 'typeorm';
import { MsSql } from 'src/database/typeorm/mssql';
import { DatabaseParam } from 'src/database/typeorm/database-params';
import { TableTypes } from 'src/database/table-types/table-types';

@Injectable()
export class ProvidersService {
  constructor(
    @InjectRepository(DatabaseEntity)
    private database: Repository<null>,
    private mssql: MsSql
  ) {}
}

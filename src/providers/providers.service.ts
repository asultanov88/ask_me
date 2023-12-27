import { Inject, Injectable, Provider } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { DatabaseEntity } from 'src/database/entities/database';
import { Repository } from 'typeorm';
import { MsSql } from 'src/database/typeorm/mssql';
import { DatabaseParam } from 'src/database/typeorm/database-params';
import { TableTypes } from 'src/database/table-types/table-types';
import { LkWeekDay } from './models/result';
import { ErrorHandler } from 'src/Helper/ErrorHandler';
import { REQUEST } from '@nestjs/core';

@Injectable()
export class ProvidersService {
  constructor(
    @InjectRepository(DatabaseEntity)
    private database: Repository<null>,
    private mssql: MsSql,
    private errorHandler: ErrorHandler,
    @Inject(REQUEST) private readonly request: Request
  ) {}

  public async getWeekDays(): Promise<LkWeekDay[]> {
    const dbQuery = this.mssql.getQuery(null, 'UspGetLkWeekkDays');
    try {
      const resultSet = await this.database.query(dbQuery);
      const parsedResult = this.mssql.parseMultiResultSet(resultSet);
      return parsedResult ? (parsedResult as LkWeekDay[]) : [];
    } catch (error) {
      this.errorHandler.throwDatabaseError(error);
    }
  }
}

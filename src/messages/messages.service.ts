import { Body, Inject, Injectable } from '@nestjs/common';
import { REQUEST } from '@nestjs/core';
import { InjectRepository } from '@nestjs/typeorm';
import { ErrorHandler } from 'src/Helper/ErrorHandler';
import { DatabaseEntity } from 'src/database/entities/database';
import { MsSql } from 'src/database/typeorm/mssql';
import { Repository } from 'typeorm';
import { SubjectDto } from './model/dto/dto';
import { DatabaseParam } from 'src/database/typeorm/database-params';
import { TableTypes } from 'src/database/table-types/table-types';

@Injectable()
export class MessagesService {
  constructor(
    @InjectRepository(DatabaseEntity)
    private database: Repository<null>,
    private mssql: MsSql,
    private errorHandler: ErrorHandler,
    @Inject(REQUEST) private readonly request: Request
  ) {}

  // Posts new subject.
  async postNewSubject(@Body() subject: SubjectDto): Promise<any> {
    const clientId = this.request['user'].clientId;
    if (!clientId) {
      this.errorHandler.throwCustomError('Only client can create a subject.');
    }
    if (subject.clientProviderId && subject.providerId) {
      this.errorHandler.throwCustomError(
        'Either clientProviderId or providerId must be supplied.'
      );
    }

    const databaseParams: DatabaseParam[] = [
      {
        inputParamName: 'Subject',
        bulkParamValue: [subject],
        tableType: TableTypes.SubjectTableType
      },
      {
        inputParamName: 'ClientId',
        parameterValue: this.mssql.convertToString(clientId)
      }
    ];

    const dbQuery: string = this.mssql.getQuery(
      databaseParams,
      'UspInsertSubject'
    );
    try {
      const resultSet = await this.database.query(dbQuery);
      const resultObj = this.mssql.parseSingleResultSet(resultSet);
      return resultObj ? resultObj : { success: false };
    } catch (error) {
      this.errorHandler.throwDatabaseError(error);
    }
  }
}

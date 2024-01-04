import { Body, Inject, Injectable } from '@nestjs/common';
import { REQUEST } from '@nestjs/core';
import { InjectRepository } from '@nestjs/typeorm';
import { ErrorHandler } from 'src/Helper/ErrorHandler';
import { DatabaseEntity } from 'src/database/entities/database';
import { MsSql } from 'src/database/typeorm/mssql';
import { Repository } from 'typeorm';
import { MessageDto, NewMessage, SubjectDto } from './model/dto/dto';
import { DatabaseParam } from 'src/database/typeorm/database-params';
import { TableTypes } from 'src/database/table-types/table-types';
import { ClientProviderMessage } from './model/result/result';

@Injectable()
export class MessagesService {
  constructor(
    @InjectRepository(DatabaseEntity)
    private database: Repository<null>,
    private mssql: MsSql,
    private errorHandler: ErrorHandler,
    @Inject(REQUEST) private readonly request: Request
  ) {}

  async getClientProviderSubjects(providerId: number): Promise<any> {
    if (isNaN(providerId)) {
      this.errorHandler.throwCustomError('ProviderId is invalid.');
    }
    const clientId = this.request['user'].clientId;
    if (!clientId) {
      this.errorHandler.throwCustomError('ClientId is not found.');
    }
    const databaseParams: DatabaseParam[] = [
      {
        inputParamName: 'ProviderId',
        parameterValue: this.mssql.convertToString(providerId)
      },
      {
        inputParamName: 'ClientId',
        parameterValue: this.mssql.convertToString(clientId)
      }
    ];

    const dbQuery: string = this.mssql.getQuery(
      databaseParams,
      'UspGetProviderSubjects'
    );

    try {
      const resultSet = await this.database.query(dbQuery);
      const resultObj = this.mssql.parseMultiResultSet(resultSet);
      return resultObj ? (resultObj as ClientProviderMessage[]) : [];
    } catch (error) {
      this.errorHandler.throwDatabaseError(error);
    }
  }

  // Posts new message.
  async postNewMessage(@Body() newMessage: NewMessage): Promise<number> {
    const messageDto: MessageDto = {
      messageId: null,
      message: newMessage.message,
      createdBy: this.request['user'].userId,
      createdAt: null,
      viewed: false
    };

    const databaseParams: DatabaseParam[] = [
      {
        inputParamName: 'SubjectId',
        parameterValue: this.mssql.convertToString(newMessage.subjectId)
      },
      {
        inputParamName: 'Message',
        tableType: TableTypes.MessageTableType,
        bulkParamValue: [messageDto]
      }
    ];

    const dbQuery: string = this.mssql.getQuery(
      databaseParams,
      'UspInsertMessage'
    );

    try {
      const resultSet = await this.database.query(dbQuery);
      const resultObj = this.mssql.parseSingleResultSet(resultSet);
      return resultObj ? resultObj : { success: false };
    } catch (error) {
      this.errorHandler.throwDatabaseError(error);
    }
  }

  // Posts new subject.
  async postNewSubject(@Body() subject: SubjectDto): Promise<any> {
    const clientId = this.request['user'].clientId;
    if (!clientId) {
      this.errorHandler.throwCustomError('Only client can create a subject.');
    }
    if (!subject.providerId) {
      this.errorHandler.throwCustomError('ProviderId must be supplied.');
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

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
import { ClientProviderMessage, Message } from './model/result/result';

@Injectable()
export class MessagesService {
  constructor(
    @InjectRepository(DatabaseEntity)
    private database: Repository<null>,
    private mssql: MsSql,
    private errorHandler: ErrorHandler,
    @Inject(REQUEST) private readonly request: Request
  ) {}

  // Gets subject list between provider and a client.
  async getProviderClientSubjects(clientId: number): Promise<any> {
    if (!clientId || isNaN(clientId)) {
      this.errorHandler.throwCustomError('clientId is not provided.');
    }

    const databaseParams: DatabaseParam[] = [
      {
        inputParamName: 'ClientId',
        parameterValue: this.mssql.convertToString(clientId)
      },
      {
        inputParamName: 'ProviderId',
        parameterValue: this.request['user'].providerId
      }
    ];

    const dbQuery: string = this.mssql.getQuery(
      databaseParams,
      'UspGetClientSubjects'
    );

    try {
      const resultSet = await this.database.query(dbQuery);
      const resultObj = this.mssql.parseMultiResultSet(resultSet);
      return resultObj ? (resultObj as ClientProviderMessage[]) : [];
    } catch (error) {
      this.errorHandler.throwDatabaseError(error);
    }
  }

  // Gets messages based on the subject id.
  async getSubjectMessages(
    subjectId: number,
    chunkCount: number,
    chunkNum: number
  ): Promise<any> {
    if (!subjectId || isNaN(subjectId)) {
      this.errorHandler.throwCustomError(
        'subjectId is required and must be a number.'
      );
    }
    if (!chunkCount || isNaN(chunkCount)) {
      this.errorHandler.throwCustomError(
        'chunkCount is required and must be a number.'
      );
    }
    if (!chunkNum || isNaN(chunkNum)) {
      this.errorHandler.throwCustomError(
        'chunkNum is required and must be a number.'
      );
    }

    const databaseParams: DatabaseParam[] = [
      {
        inputParamName: 'SubjectId',
        parameterValue: this.mssql.convertToString(subjectId)
      },
      {
        inputParamName: 'ChunkCount',
        parameterValue: this.mssql.convertToString(chunkCount)
      },
      {
        inputParamName: 'ChunkNum',
        parameterValue: this.mssql.convertToString(chunkNum)
      },
      {
        inputParamName: 'UserId',
        parameterValue: this.request['user'].userId
      },
      {
        inputParamName: 'IsClient',
        parameterValue: this.request['user'].clientId
          ? this.mssql.convertToString(true)
          : this.mssql.convertToString(false)
      }
    ];

    const dbQuery: string = this.mssql.getQuery(
      databaseParams,
      'UspGetSubjectMessages'
    );

    try {
      const resultSet = await this.database.query(dbQuery);
      const resultObj = this.mssql.parseMultiResultSet(resultSet);
      return resultObj ? (resultObj as Message[]) : [];
    } catch (error) {
      this.errorHandler.throwDatabaseError(error);
    }
  }

  // Gets subject list between the selected provider and a client.
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

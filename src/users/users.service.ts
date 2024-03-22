import { Inject, Injectable, Scope } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { DatabaseEntity } from 'src/database/entities/database';
import { TableTypes } from 'src/database/table-types/table-types';
import { DatabaseParam } from 'src/database/typeorm/database-params';
import { MsSql } from 'src/database/typeorm/mssql';
import { Repository } from 'typeorm';
import { UserDto } from './models/dto';
import * as bcrypt from 'bcrypt';
import { ErrorHandler } from 'src/Helper/ErrorHandler';
import { AuthUserResult, UserResult } from './models/result';
import { REQUEST } from '@nestjs/core';

@Injectable({ scope: Scope.REQUEST })
export class UsersService {
  constructor(
    @InjectRepository(DatabaseEntity)
    private database: Repository<null>,
    private mssql: MsSql,
    private errorHandler: ErrorHandler,
    @Inject(REQUEST) private readonly request: Request
  ) {}

  // Gets user by email.
  async getUserByEmail(email: string): Promise<AuthUserResult> {
    const databaseParams: DatabaseParam[] = [
      {
        inputParamName: 'Email',
        parameterValue: email
      }
    ];

    const dbQuery = this.mssql.getQuery(databaseParams, 'UspGetUserByEmail');
    try {
      const resultSet = await this.database.query(dbQuery);
      const parsedResult = this.mssql.parseSingleResultSet(resultSet);
      return parsedResult
        ? (parsedResult as AuthUserResult)
        : ({} as AuthUserResult);
    } catch (error) {
      this.errorHandler.throwError(error);
    }
  }

  // Inserts a new user.
  async postUser(user: UserDto): Promise<number> {
    if (user.isClient === true && user.isProvider === true) {
      this.errorHandler.throwError('User cannot be Client and Provider.');
    }
    if (user.isClient === false && user.isProvider === false) {
      this.errorHandler.throwError('User must be either Client or Provider.');
    }

    user.password = await bcrypt.hash(user.password, process.env.SALT_KEY);

    const databaseParams: DatabaseParam[] = [
      {
        tableType: TableTypes.UserTableType,
        inputParamName: 'User',
        bulkParamValue: [user]
      }
    ];

    const dbQuery: string = this.mssql.getQuery(
      databaseParams,
      'UspInsertUser'
    );
    try {
      const resultSet = await this.database.query(dbQuery);
      const resultObj = this.mssql.parseSingleResultSet(resultSet);
      return resultObj ? resultObj : { userId: null };
    } catch (error) {
      this.errorHandler.throwError(error);
    }
  }
}

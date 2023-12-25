import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { DatabaseEntity } from 'src/database/entities/database';
import { TableTypes } from 'src/database/table-types/table-types';
import { DatabaseParam } from 'src/database/typeorm/database-params';
import { MsSql } from 'src/database/typeorm/mssql';
import { Repository } from 'typeorm';
import { UserDto } from './models/dto';
import * as bcrypt from 'bcrypt';
import { ErrorHandler } from 'src/Helper/ErrorHandler';

@Injectable()
export class UsersService {
  constructor(
    @InjectRepository(DatabaseEntity)
    private database: Repository<null>,
    private mssql: MsSql,
    private errorHandler: ErrorHandler
  ) {}

  // Gets user by email.
  async getUserByEmail(email: string): Promise<UserDto> {
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
      return parsedResult ? (parsedResult as UserDto) : ({} as UserDto);
    } catch (error) {
      this.errorHandler.throwDatabaseError(error);
    }
  }

  // Inserts a new user.
  async postUser(user: UserDto): Promise<number> {
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
      this.errorHandler.throwDatabaseError(error);
    }
  }
}

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

  async getUserByEmail(email: string): Promise<UserDto> {
    const databaseParams: DatabaseParam[] = [
      {
        inputParamName: 'Email',
        parameterValue: email
      }
    ];

    const dbQuery = this.mssql.getQuery(databaseParams, 'UspGetUserByEmail');
    try {
      const result = await this.database.query(dbQuery);
      return result?.length > 0 ? (result[0] as UserDto) : ({} as UserDto);
    } catch (error) {
      this.errorHandler.throwDatabaseError(error);
    }
  }

  async postuser(user: UserDto): Promise<number> {
    user.Password = await bcrypt.hash(user.Password, process.env.SALT_KEY);

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
      const result = await this.database.query(dbQuery);
      return result;
    } catch (error) {
      this.errorHandler.throwDatabaseError(error);
    }
  }
}

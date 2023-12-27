import { Inject, Injectable, Provider } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { DatabaseEntity } from 'src/database/entities/database';
import { Repository } from 'typeorm';
import { MsSql } from 'src/database/typeorm/mssql';
import { DatabaseParam } from 'src/database/typeorm/database-params';
import { TableTypes } from 'src/database/table-types/table-types';
import {
  LkProviderCategory,
  LkWeekDay,
  LkWorkHour,
  ProviderDetails
} from './models/result';
import { ErrorHandler } from 'src/Helper/ErrorHandler';
import { REQUEST } from '@nestjs/core';
import { ProviderDetailsDto, ProviderWorkHourDto } from './models/dto';
import { PkDto } from 'src/database/table-types/shared-dto';
import { BooleanResult } from 'src/database/table-types/shared-result';

@Injectable()
export class ProvidersService {
  constructor(
    @InjectRepository(DatabaseEntity)
    private database: Repository<null>,
    private mssql: MsSql,
    private errorHandler: ErrorHandler,
    @Inject(REQUEST) private readonly request: Request
  ) {}

  // Gets LkCategory lookup table values.
  public async getCategories(): Promise<LkProviderCategory[]> {
    const dbQuery = this.mssql.getQuery(null, 'UspGetLkCategories');
    try {
      const resultSet = await this.database.query(dbQuery);
      const parsedResult = this.mssql.parseMultiResultSet(resultSet);
      return parsedResult ? (parsedResult as LkProviderCategory[]) : [];
    } catch (error) {
      this.errorHandler.throwDatabaseError(error);
    }
  }

  // Gets LkWeekDay lookup table values.
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

  // Gets LkWorkHour lookup table values.
  public async getWorkHours(): Promise<LkWorkHour[]> {
    const dbQuery = this.mssql.getQuery(null, 'UspGetLkWorkHours');
    try {
      const resultSet = await this.database.query(dbQuery);
      const parsedResult = this.mssql.parseMultiResultSet(resultSet);
      return parsedResult ? (parsedResult as LkWorkHour[]) : [];
    } catch (error) {
      this.errorHandler.throwDatabaseError(error);
    }
  }

  // Posts provider details.
  public async postProviderDetails(
    providerDetails: ProviderDetails
  ): Promise<BooleanResult> {
    const providerDetailsDto: ProviderDetailsDto[] = [
      {
        providerDetailsId: null,
        providerId: this.request['user'].providerId,
        companyName: providerDetails.companyName,
        address: providerDetails.address,
        phoneNumber: providerDetails.phoneNumber,
        description: providerDetails.description
      }
    ];

    const availableDaysPkDto: PkDto[] = [];
    providerDetails.availableDays.forEach((d) => {
      availableDaysPkDto.push({ pk: d });
    });

    const categoryPkDto: PkDto[] = [];
    providerDetails.category.forEach((c) => {
      categoryPkDto.push({ pk: c });
    });

    const availableHoursDto: ProviderWorkHourDto[] = [
      {
        providerWorkHourId: null,
        providerId: this.request['user'].providerId,
        fromLkWorkHourId: providerDetails.workHours.fromWorkHourId,
        toLkWorkHourId: providerDetails.workHours.toWorkHourId
      }
    ];

    const databaseParams: DatabaseParam[] = [
      {
        tableType: TableTypes.ProviderDetailTableType,
        inputParamName: 'ProviderDetails',
        bulkParamValue: providerDetailsDto
      },
      {
        tableType: TableTypes.PkTableType,
        inputParamName: 'ProviderDays',
        bulkParamValue: availableDaysPkDto
      },
      {
        tableType: TableTypes.PkTableType,
        inputParamName: 'ProviderCategory',
        bulkParamValue: categoryPkDto
      },
      {
        tableType: TableTypes.ProviderWorkHourTableType,
        inputParamName: 'ProviderWorkHour',
        bulkParamValue: availableHoursDto
      }
    ];

    const dbQuery: string = this.mssql.getQuery(
      databaseParams,
      'UspInsertProviderDetails'
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

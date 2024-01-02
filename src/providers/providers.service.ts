import { Inject, Injectable, Provider } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { DatabaseEntity } from 'src/database/entities/database';
import { Repository } from 'typeorm';
import { MsSql } from 'src/database/typeorm/mssql';
import { DatabaseParam } from 'src/database/typeorm/database-params';
import { TableTypes } from 'src/database/table-types/table-types';
import {
  ClientProvider,
  LkProviderCategory,
  LkWeekDay,
  LkWorkHour,
  ProviderDetails,
  ProviderDetailsResult,
  ProviderSearch,
  SelectProvider
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

  // Gets client's provider list.
  async getMyProviders(): Promise<any> {
    const clientId = this.request['user'].clientId;
    if (!clientId) {
      this.errorHandler.throwCustomError('Invalied client id.');
    }

    const databaseParams: DatabaseParam[] = [
      {
        inputParamName: 'ClientId',
        parameterValue: this.mssql.convertToString(clientId)
      }
    ];

    const dbQuery = this.mssql.getQuery(databaseParams, 'UspGetMyProviders');
    try {
      const resultSet = await this.database.query(dbQuery);
      const parsedResult = this.mssql.parseMultiResultSet(resultSet);
      return parsedResult ? (parsedResult as ClientProvider[]) : [];
    } catch (error) {
      this.errorHandler.throwDatabaseError(error);
    }
  }

  // Selects provider.
  async postSelectProvider(providerId: number): Promise<any> {
    console.log(providerId);

    const clientId = this.request['user'].clientId;
    if (!clientId) {
      this.errorHandler.throwCustomError('Only clients can select provider.');
    }
    if (!providerId || providerId === 0) {
      this.errorHandler.throwCustomError('ProviderId must be supplied.');
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

    const dbQuery = this.mssql.getQuery(
      databaseParams,
      'UspInsertClientProvider'
    );
    try {
      const resultSet = await this.database.query(dbQuery);
      const parsedResult = this.mssql.parseSingleResultSet(resultSet);
      return parsedResult ? parsedResult : {};
    } catch (error) {
      this.errorHandler.throwDatabaseError(error);
    }
  }

  // Provider search based on params.
  async getProviderSearch(searchParams: ProviderSearch): Promise<any> {
    if (
      !searchParams.lkCategoryId &&
      (!searchParams.searchKeyword || searchParams.searchKeyword?.trim() === '')
    ) {
      this.errorHandler.throwCustomError(
        'Both lkCategoryId and searchKeyword cannot be null.'
      );
    }

    const databaseParams: DatabaseParam[] = [
      {
        inputParamName: 'LkCategoryId',
        parameterValue: this.mssql.convertToString(searchParams.lkCategoryId)
      },
      {
        inputParamName: 'SearchKeyword',
        parameterValue: this.mssql.convertToString(searchParams.searchKeyword)
      }
    ];

    const dbQuery = this.mssql.getQuery(databaseParams, 'UspGetProviderSearch');
    try {
      const resultSet = await this.database.query(dbQuery);
      const parsedResult = this.mssql.parseMultiResultSet(resultSet);
      return parsedResult ? parsedResult : [];
    } catch (error) {
      this.errorHandler.throwDatabaseError(error);
    }
  }

  // Gets provider details.
  async getProviderDetails(
    providerId: number
  ): Promise<ProviderDetailsResult | any> {
    if (!providerId) {
      providerId = this.request['user'].providerId;
    }
    if (isNaN(providerId)) {
      this.errorHandler.throwCustomError('ProviderId must be a number.');
    }
    if (!providerId) {
      this.errorHandler.throwCustomError('ProviderId not found.');
    }

    // The same param is used for all 3 SPs.
    const databaseParams: DatabaseParam[] = [
      {
        inputParamName: 'ProviderId',
        parameterValue: this.mssql.convertToString(providerId)
      }
    ];

    const dbQueryProviderDetails = this.mssql.getQuery(
      databaseParams,
      'UspGetProviderDetails'
    );

    const dbQueryProviderWeekDays = this.mssql.getQuery(
      databaseParams,
      'UspGetProviderWeekDays'
    );

    const dbQueryProviderCategories = this.mssql.getQuery(
      databaseParams,
      'UspGetProviderCategory'
    );
    try {
      const providerDetails = this.mssql.parseSingleResultSet(
        await this.database.query(dbQueryProviderDetails)
      );
      const providerWeekDays = this.mssql.parseMultiResultSet(
        await this.database.query(dbQueryProviderWeekDays)
      );
      const providerCategories = this.mssql.parseMultiResultSet(
        await this.database.query(dbQueryProviderCategories)
      );

      if (providerWeekDays?.length > 0) {
        providerDetails.availableDays = providerWeekDays as LkWeekDay[];
      }
      if (providerCategories?.length > 0) {
        providerDetails.category = providerCategories as LkProviderCategory[];
      }

      return providerDetails ? (providerDetails as ProviderDetailsResult) : {};
    } catch (error) {
      this.errorHandler.throwDatabaseError(error);
    }
  }

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

import { Injectable, Provider } from '@nestjs/common';
import { ProviderDto } from './models/dto';
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

  public async getProviders(
    providers: ProviderDto[],
    providers2: ProviderDto[],
    pracitionerId: string
  ): Promise<any> {
    const databaseParams: DatabaseParam[] = [
      {
        tableType: TableTypes.ProviderTableType,
        inputParamName: 'Providers',
        bulkParamValue: providers
      },
      {
        tableType: TableTypes.ProviderTableType,
        inputParamName: 'Providers2',
        bulkParamValue: providers2
      },
      {
        inputParamName: 'PractitionerId',
        parameterValue: pracitionerId
      }
    ];

    const result = await this.database.query(
      this.mssql.getQuery(databaseParams, 'UspGetAllProviders')
    );

    return result;
  }
}

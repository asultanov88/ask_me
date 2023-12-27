import { UserDto } from 'src/users/models/dto';
import { PkDto } from './shared-dto';
import {
  ProviderDetailsDto,
  ProviderWorkHourDto
} from 'src/providers/models/dto';

export class TableTypes {
  public static UserTableType: TableType = {
    typeName: 'UserTableType',
    fields: [
      'userId',
      'firstName',
      'lastName',
      'email',
      'password',
      'createdAt',
      'inactive',
      'isClient',
      'isProvider'
    ],
    dto: new UserDto()
  };

  public static PkTableType: TableType = {
    typeName: 'PkTableType',
    fields: ['pk'],
    dto: new PkDto()
  };

  public static ProviderDetailTableType: TableType = {
    typeName: 'ProviderDetailsTableType',
    fields: [
      'providerDetailsId',
      'providerId',
      'companyName',
      'address',
      'phoneNumber',
      'description'
    ],
    dto: new ProviderDetailsDto()
  };

  public static ProviderWorkHourTableType: TableType = {
    typeName: 'ProviderWorkHourTableType',
    fields: [
      'providerWorkHourId',
      'providerId',
      'fromLkWorkHourId',
      'toLkWorkHourId'
    ],
    dto: new ProviderWorkHourDto()
  };
}

export interface TableType {
  typeName: string;
  fields: string[];
  dto: any;
}

import { ProviderDto } from 'src/providers/models/dto';
import { UserDto } from 'src/users/models/dto';

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
      'inactive'
    ],
    dto: new UserDto()
  };
  public static ProviderTableType: TableType = {
    typeName: 'ProviderTableType',
    fields: ['providerId', 'firstName', 'lastName', 'createdAt'],
    dto: new ProviderDto()
  };
}

export interface TableType {
  typeName: string;
  fields: string[];
  dto: any;
}

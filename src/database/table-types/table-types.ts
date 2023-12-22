import { ProviderDto } from 'src/providers/models/dto';
import { UserDto } from 'src/users/models/dto';

export class TableTypes {
  public static UserTableType: TableType = {
    typeName: 'UserTableType',
    fields: [
      'UserId',
      'FirstName',
      'LastName',
      'Email',
      'Password',
      'CreatedAt',
      'Inactive'
    ],
    dto: new UserDto()
  };
  public static ProviderTableType: TableType = {
    typeName: 'ProviderTableType',
    fields: ['ProviderId', 'FirstName', 'LastName', 'CreatedAt'],
    dto: new ProviderDto()
  };
}

export interface TableType {
  typeName: string;
  fields: string[];
  dto: any;
}

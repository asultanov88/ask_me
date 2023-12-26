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
      'inactive',
      'isClient',
      'isProvider'
    ],
    dto: new UserDto()
  };
}

export interface TableType {
  typeName: string;
  fields: string[];
  dto: any;
}

import { ProviderDto } from 'src/providers/models/dto';

export class TableTypes {
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

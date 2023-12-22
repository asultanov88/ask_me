import { TableType } from '../table-types/table-types';

export class DatabaseParam {
  // Stored procedure input parameter name.
  public inputParamName?: string;

  // Parameter value
  public parameterValue?: string;

  // TableType name.
  public tableType?: TableType;

  // Bulk parameter value.
  public bulkParamValue?: any[];
}

export interface ProcessesQueryParam {
  paramName: string;
  declarationnName: string;
  paramValue: string;
}

export interface DataKeyMismatch {
  mismatch: boolean;
  paramKey: string[];
  dtoKey: string[];
}

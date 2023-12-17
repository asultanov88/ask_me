import { Injectable } from '@nestjs/common';
import { DatabaseParam, ProcessesQueryParam } from './database-params';

@Injectable()
export class MsSql {
  // Blank spance.
  private readonly blank: string = ' ';

  // New line.
  private readonly newLine: string = '\n';

  // Builds SQL query for execution.
  public getQuery(
    params: DatabaseParam[],
    storedProcedurename: string
  ): string {
    let query: string = '';
    const queryParams: ProcessesQueryParam[] = [];
    params.forEach((p, index) => {
      queryParams.push(this.parseParam(p, index));
    });
    queryParams.forEach((qp) => {
      if (qp.declarationnName) {
        query += `${qp.paramValue}${this.blank}`;
      }
    });

    query += `${this.newLine}EXEC [dbo].[${storedProcedurename}]${this.blank}`;
    queryParams.forEach((qp, qpIndex) => {
      if (qp.declarationnName) {
        query += `@${qp.paramName}=${qp.declarationnName}${
          queryParams.length - qpIndex === 1 ? '' : ','
        }`;
      }
      if (!qp.declarationnName) {
        query += `@${qp.paramName}=${qp.paramValue}${
          queryParams.length - qpIndex === 1 ? '' : ','
        }`;
      }
    });

    return query;
  }

  private parseParam(param: DatabaseParam, index: number): ProcessesQueryParam {
    let query: string = '';
    let processesParam: ProcessesQueryParam = null;
    // Bulk value set using table type.
    if (param?.tableType?.typeName && param?.bulkParamValue?.length > 0) {
      // Stop execution due to table type vs DTO type mismatch.
      if (!this.dtoTypeCheck(param.bulkParamValue[0], param.tableType.dto)) {
        throw new Error();
      }
      query = `${this.newLine}DECLARE @p${index?.toString()} dbo.${
        param.tableType.typeName
      }${this.blank}`;
      query += `${this.newLine}INSERT INTO @p${index?.toString()} VALUES`;

      param.bulkParamValue.forEach((bp, bulkValueIndex) => {
        const bulkParamObj = JSON.parse(JSON.stringify(bp));
        query += `${this.newLine}(`;
        param.tableType.fields.forEach((f, valueIndex) => {
          query += `${
            !bulkParamObj[f] ||
            bulkParamObj[f]?.toString()?.toLowerCase() === 'null' ||
            bulkParamObj[f]?.toString()?.trim() === ''
              ? 'NULL'
              : this.escapeSql(bulkParamObj[f])
          }${param.tableType.fields.length - valueIndex === 1 ? '' : ','}`;
        });
        query += `)${
          param.bulkParamValue.length - bulkValueIndex === 1 ? '' : ','
        }`;
      });
      processesParam = {
        paramName: param.inputParamName,
        paramValue: query,
        declarationnName: `@p${index?.toString()}`
      };
    }
    // Single parameter value.
    if (
      !param.bulkParamValue ||
      param?.bulkParamValue?.length < 1 ||
      !param.tableType
    ) {
      processesParam = {
        paramName: param.inputParamName,
        paramValue: this.escapeSql(param.parameterValue),
        declarationnName: null
      };
    }

    return processesParam;
  }

  // Escapes single quote, wraps string into single quotes
  private escapeSql(input: string): string {
    input = input.replaceAll("'", "''");
    return `'${input}'`;
  }

  // Checks bulk insert DTO against the Table Type.
  private dtoTypeCheck(param: any, dtoType: any): boolean {
    const paramKeys: string[] = Object.keys(param);
    const dtoKeys: string[] = Object.keys(dtoType);
    return JSON.stringify(paramKeys) === JSON.stringify(dtoKeys);
  }
}

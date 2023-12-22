import { HttpException, HttpStatus, Injectable } from '@nestjs/common';
import { DataKeyMismatch } from 'src/database/typeorm/database-params';

@Injectable()
export class ErrorHandler {
  public throwDataMismatchError(dataKeyMismatch: DataKeyMismatch) {
    throw new HttpException(
      process.env.ENVIRONMENT === 'development'
        ? `Data key mismatch. Expected: ${dataKeyMismatch.dtoKey}, received: ${dataKeyMismatch.paramKey}`
        : 'Data key mismatch',
      HttpStatus.INTERNAL_SERVER_ERROR
    );
  }

  public throwDatabaseError(dbError: any) {
    throw new HttpException(
      process.env.ENVIRONMENT === 'development'
        ? dbError?.driverError?.originalError?.info?.message
        : 'Database Error',
      HttpStatus.INTERNAL_SERVER_ERROR
    );
  }
}

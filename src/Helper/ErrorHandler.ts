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

  public throwError(error: any) {
    if (error?.driverError?.originalError?.info?.message) {
      throw new HttpException(
        process.env.ENVIRONMENT === 'development'
          ? error.driverError.originalError.info.message
          : 'Database Error',
        HttpStatus.INTERNAL_SERVER_ERROR
      );
    } else {
      throw new HttpException(error, HttpStatus.INTERNAL_SERVER_ERROR);
    }
  }
}

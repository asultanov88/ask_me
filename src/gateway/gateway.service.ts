import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Socket } from 'socket.io';
import { ErrorHandler } from 'src/Helper/ErrorHandler';
import { DatabaseEntity } from 'src/database/entities/database';
import { MsSql } from 'src/database/typeorm/mssql';
import { Repository } from 'typeorm';
import { PostedMessage, SocketMessageDto, ViewedMessage } from './dto';
import { MessageDto } from 'src/messages/model/dto/dto';
import { TableTypes } from 'src/database/table-types/table-types';
import { DatabaseParam } from 'src/database/typeorm/database-params';

@Injectable()
export class GatewayService {
  constructor(
    @InjectRepository(DatabaseEntity)
    private database: Repository<null>,
    private mssql: MsSql,
    private errorHandler: ErrorHandler
  ) {}
  // Maps socketId with socket instances.
  public readonly connectedClients: Map<string, Socket> = new Map();

  // Maps userId with socketId.
  public readonly userSocketClinet: Map<number, string> = new Map();

  // Marks message as viewed.
  async updateMessageAsViewed(message: ViewedMessage): Promise<void> {
    const databaseParams: DatabaseParam[] = [
      {
        inputParamName: 'MessageId',
        parameterValue: this.mssql.convertToString(message.messageId)
      }
    ];

    const dbQuery: string = this.mssql.getQuery(
      databaseParams,
      'UspUpdateMessageViewed'
    );

    try {
      await this.database.query(dbQuery);
    } catch (error) {
      this.errorHandler.throwDatabaseError(error);
    }
  }

  // Posts new message.
  async postNewMessage(newMessage: SocketMessageDto): Promise<any> {
    const messageDto: MessageDto = {
      messageId: null,
      message: newMessage.message,
      createdBy: newMessage.user.userId,
      createdAt: null,
      viewed: false
    };

    const databaseParams: DatabaseParam[] = [
      {
        inputParamName: 'SubjectId',
        parameterValue: this.mssql.convertToString(newMessage.subjectId)
      },
      {
        inputParamName: 'Message',
        tableType: TableTypes.MessageTableType,
        bulkParamValue: [messageDto]
      }
    ];

    const dbQuery: string = this.mssql.getQuery(
      databaseParams,
      'UspInsertMessage'
    );

    let postedMessage: PostedMessage = null;

    try {
      const resultSet = await this.database.query(dbQuery);
      const resultObj = this.mssql.parseSingleResultSet(resultSet);
      postedMessage = {
        messageId: resultObj.messageId,
        message: newMessage.message,
        error: null
      };
      return postedMessage;
    } catch (error) {
      postedMessage = {
        messageId: null,
        message: newMessage.message,
        error: 'Unable to save the message'
      };
      return postedMessage;
    }
  }
}

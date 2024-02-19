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
import { MessageViewed } from 'src/messages/model/result/result';
import { CommonService } from 'src/common/common.service';

@Injectable()
export class GatewayService {
  constructor(
    @InjectRepository(DatabaseEntity)
    private database: Repository<null>,
    private mssql: MsSql,
    private errorHandler: ErrorHandler,
    private commonService: CommonService
  ) {}
  // Maps socketId with socket instances.
  public readonly connectedClients: Map<string, Socket> = new Map();

  // Maps userId with socketId.
  public readonly userSocketClinet: Map<number, string> = new Map();

  // Marks message as viewed.
  async updateMessageAsViewed(message: ViewedMessage): Promise<MessageViewed> {
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
      const resultSet = await this.database.query(dbQuery);
      const resultObj = this.mssql.parseSingleResultSet(resultSet);
      return resultObj as MessageViewed;
    } catch (error) {
      this.errorHandler.throwDatabaseError(error);
    }
  }

  // Posts new message.
  async postNewMessage(newMessage: SocketMessageDto): Promise<any> {
    const messageDto: MessageDto = {
      messageId: null,
      message: newMessage.message,
      isAttachment: newMessage.isAttachment ?? false,
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
        inputParamName: 'ReplyToMessageId',
        parameterValue: this.mssql.convertToString(newMessage.replyToMessageId)
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
        subjectId: newMessage.subjectId,
        messageId: resultObj.messageId,
        message: resultObj.message,
        isAttachment: resultObj.isAttachment,
        createdBy: resultObj.createdBy,
        createdAt: resultObj.createdAt,
        viewed: resultObj.viewed,
        error: null,
        attachments: [],
        replyToMessage: {
          replyToMessageId: resultObj.replyToMessageId,
          replyToMessage: resultObj.replyToMessage,
          originalMessageCreatedBy: resultObj.originalMessageCreatedBy,
          thumbnailUrl: this.commonService.getSignedUrl(
            resultObj.thumbnailS3Bucket,
            resultObj.thumbnailS3Key
          ),
          attachmentOriginalName: resultObj.attachmentOriginalName
        }
      };
      return postedMessage;
    } catch (error) {
      postedMessage = {
        subjectId: null,
        error: 'Unable to save the message',
        messageId: null,
        message: newMessage.message,
        isAttachment: false,
        createdBy: null,
        createdAt: null,
        viewed: false,
        attachments: [],
        replyToMessage: {
          replyToMessageId: null,
          replyToMessage: null,
          originalMessageCreatedBy: null,
          thumbnailUrl: null,
          attachmentOriginalName: null
        }
      };

      return postedMessage;
    }
  }

  public getSocketByUserId(userId: number): Socket {
    const socketId: string = this.userSocketClinet.get(userId);
    const socket: Socket = this.connectedClients.get(socketId);
    return socket;
  }

  // Emits message to receiver.
  public emitMessageToReceiver(
    toUserId: number,
    postedMessage: PostedMessage
  ): void {
    const receiverUserId: number = parseInt(toUserId.toString(), 10);
    const receiverSocket: Socket = this.getSocketByUserId(receiverUserId);
    if (receiverSocket) {
      receiverSocket.emit('incomingMessage', postedMessage);
    }
  }

  //Emits message back to the sender.
  public emitMessageToSender(
    senderUserId: number,
    postedMessage: PostedMessage
  ): void {
    const senderSocket: Socket = this.getSocketByUserId(senderUserId);
    if (senderSocket) {
      senderSocket.emit('returnMessage', postedMessage);
    }
  }
}

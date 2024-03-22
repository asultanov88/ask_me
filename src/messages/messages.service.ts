import { Body, Inject, Injectable } from '@nestjs/common';
import { REQUEST } from '@nestjs/core';
import { InjectRepository } from '@nestjs/typeorm';
import { ErrorHandler } from 'src/Helper/ErrorHandler';
import { AttachmentMessageDto } from 'src/attachments/model/dto';
import {
  MessageAttachmentWithThumbnailResult,
  ThumbnailObject
} from 'src/attachments/model/result';
import { CommonService } from 'src/common/common.service';
import { DatabaseEntity } from 'src/database/entities/database';
import { TableTypes } from 'src/database/table-types/table-types';
import { DatabaseParam } from 'src/database/typeorm/database-params';
import { MsSql } from 'src/database/typeorm/mssql';
import { MessageHistory, PostedMessage } from 'src/gateway/dto';
import { Repository } from 'typeorm';
import { MessageDto, SubjectDto } from './model/dto/dto';
import {
  Attachment,
  ClientProviderMessage,
  Message
} from './model/result/result';
import { BooleanResult } from 'src/database/table-types/shared-result';

@Injectable()
export class MessagesService {
  constructor(
    @InjectRepository(DatabaseEntity)
    private database: Repository<null>,
    private mssql: MsSql,
    private errorHandler: ErrorHandler,
    private commonService: CommonService,
    @Inject(REQUEST) private readonly request: Request
  ) {}

  // Deletes message by Id.
  async deleteMessageById(messageId: number): Promise<any> {
    if (!messageId) {
      this.errorHandler.throwError('MessageId is required.');
    }

    const databaseParams: DatabaseParam[] = [
      {
        inputParamName: 'MessageId',
        parameterValue: this.mssql.convertToString(messageId)
      }
    ];

    const dbQuery: string = this.mssql.getQuery(
      databaseParams,
      'UspDeleteMessage'
    );

    try {
      const resultSet = await this.database.query(dbQuery);
      const result: BooleanResult = {
        success: true
      };
      return result;
    } catch (error) {
      this.errorHandler.throwError(error);
    }
  }

  // Posts a message with attachment.
  async postAttachmentMessage(
    attachmentMessage: AttachmentMessageDto
  ): Promise<any> {
    if (!attachmentMessage.isAttachment) {
      this.errorHandler.throwError(
        'IsAttachment must be true to post attachment message.'
      );
    }
    const messageDto: MessageDto = {
      messageId: null,
      message: attachmentMessage.message,
      isAttachment: true,
      createdBy: this.request['user'].userId,
      createdAt: null,
      lastUpdatedAt: null,
      viewed: false
    };

    const databaseParams: DatabaseParam[] = [
      {
        tableType: TableTypes.MessageTableType,
        inputParamName: 'Message',
        bulkParamValue: [messageDto]
      },
      {
        inputParamName: 'SubjectId',
        parameterValue: this.mssql.convertToString(attachmentMessage.subjectId)
      },
      {
        inputParamName: 'ReplyToMessageId',
        parameterValue: this.mssql.convertToString(
          attachmentMessage.replyToMessageId
        )
      }
    ];

    const dbQuery: string = this.mssql.getQuery(
      databaseParams,
      'UspInsertMessage'
    );

    try {
      const resultSet = await this.database.query(dbQuery);
      const resultObj = this.mssql.parseSingleResultSet(resultSet);
      const postedMessage: PostedMessage = {
        subjectId: attachmentMessage.subjectId,
        messageId: resultObj.messageId,
        message: resultObj.message,
        isAttachment: resultObj.isAttachment,
        createdBy: resultObj.createdBy,
        createdAt: resultObj.createdAt,
        lastUpdatedAt: resultObj.lastUpdatedAt,
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
        },
        messageHistory: await this.commonService.getMessageHistory([
          resultObj.messageId
        ])
      };
      return postedMessage;
    } catch (error) {
      this.errorHandler.throwError(error);
    }
  }

  // Gets subject list between provider and a client.
  async getProviderClientSubjects(clientId: number): Promise<any> {
    if (!clientId || isNaN(clientId)) {
      this.errorHandler.throwError('clientId is not provided.');
    }

    const databaseParams: DatabaseParam[] = [
      {
        inputParamName: 'ClientId',
        parameterValue: this.mssql.convertToString(clientId)
      },
      {
        inputParamName: 'ProviderId',
        parameterValue: this.request['user'].providerId
      }
    ];

    const dbQuery: string = this.mssql.getQuery(
      databaseParams,
      'UspGetClientSubjects'
    );

    try {
      const resultSet = await this.database.query(dbQuery);
      const resultObj = this.mssql.parseMultiResultSet(resultSet);
      return resultObj ? (resultObj as ClientProviderMessage[]) : [];
    } catch (error) {
      this.errorHandler.throwError(error);
    }
  }

  // Gets messages based on the subject id.
  async getSubjectMessages(
    subjectId: number,
    chunkCount: number,
    chunkNum: number
  ): Promise<Message[]> {
    if (!subjectId || isNaN(subjectId)) {
      this.errorHandler.throwError(
        'subjectId is required and must be a number.'
      );
    }
    if (!chunkCount || isNaN(chunkCount)) {
      this.errorHandler.throwError(
        'chunkCount is required and must be a number.'
      );
    }
    if (!chunkNum || isNaN(chunkNum)) {
      this.errorHandler.throwError(
        'chunkNum is required and must be a number.'
      );
    }

    const databaseParams: DatabaseParam[] = [
      {
        inputParamName: 'SubjectId',
        parameterValue: this.mssql.convertToString(subjectId)
      },
      {
        inputParamName: 'ChunkCount',
        parameterValue: this.mssql.convertToString(chunkCount)
      },
      {
        inputParamName: 'ChunkNum',
        parameterValue: this.mssql.convertToString(chunkNum)
      },
      {
        inputParamName: 'UserId',
        parameterValue: this.request['user'].userId
      },
      {
        inputParamName: 'IsClient',
        parameterValue: this.request['user'].clientId
          ? this.mssql.convertToString(true)
          : this.mssql.convertToString(false)
      }
    ];

    const dbQuery: string = this.mssql.getQuery(
      databaseParams,
      'UspGetSubjectMessages'
    );

    try {
      const resultSet = await this.database.query(dbQuery);
      const subjectMessagesRaw = this.mssql.parseMultiResultSet(resultSet);
      const messageHistoryArr: MessageHistory[] =
        await this.commonService.getMessageHistory(
          subjectMessagesRaw.map((m) => m.messageId)
        );

      const subjectMessages: Message[] = [];
      subjectMessagesRaw.forEach((m) => {
        const message: Message = {
          messageId: m.messageId,
          message: m.message,
          isAttachment: m.isAttachment,
          createdBy: m.createdBy,
          createdAt: m.createdAt,
          lastUpdatedAt: m.lastUpdatedAt,
          viewed: m.viewed,
          attachments: [],
          replyToMessage: {
            replyToMessageId: m.replyToMessageId,
            replyToMessage: m.replyToMessage,
            originalMessageCreatedBy: m.originalMessageCreatedBy,
            thumbnailUrl: this.commonService.getSignedUrl(
              m.thumbnailS3Bucket,
              m.thumbnailS3Key
            ),
            attachmentOriginalName: m.attachmentOriginalName
          },
          messageHistory: messageHistoryArr.filter((mh) => {
            if (mh.messageId == m.messageId) {
              return mh;
            }
          })
        };

        subjectMessages.push(message);
      });

      // Get message atatachments.
      const messageIdsArr: number[] = subjectMessages.map((m) => m.messageId);
      const messageAttachmentsArr: MessageAttachmentWithThumbnailResult[] =
        await this.commonService.getMessageAttachments(messageIdsArr);

      subjectMessages.forEach((sm) => {
        const relatedAttachments = messageAttachmentsArr.filter(
          (ma) => ma.messageId === sm.messageId
        );
        const attachments: Attachment[] = [];
        relatedAttachments.forEach((ra) => {
          attachments.push({
            messageAttachmentId: ra.messageAttachmentId,
            attachmentOriginalName: ra.originalName,
            attachmentMimeType: ra.mimeType,
            attachmentThumbnailId: ra.attachmentThumbnailId,
            thumbnailUrl: null
          });
        });
        sm.attachments = attachments;
      });

      let allThumbnailIdsArr: number[] = [];
      // Get attachment thumbnails.
      subjectMessages.forEach((sm) => {
        const messageThumbnaildIdArr: number[] = sm.attachments
          .filter((attachment) => attachment.attachmentThumbnailId)
          .map((attachment) => attachment.attachmentThumbnailId);

        allThumbnailIdsArr = allThumbnailIdsArr.concat(messageThumbnaildIdArr);
      });

      const allThumbnails: ThumbnailObject[] =
        await this.commonService.getThumbnails(allThumbnailIdsArr);

      subjectMessages.forEach((sm) => {
        sm.attachments.forEach((attachment) => {
          attachment.thumbnailUrl =
            allThumbnails.find(
              (t) =>
                t.attachmentThumbnailId === attachment.attachmentThumbnailId
            )?.thumbnailUrl ?? null;
        });
      });

      return subjectMessages;
    } catch (error) {
      this.errorHandler.throwError(error);
    }
  }

  // Gets subject list between the selected provider and a client.
  async getClientProviderSubjects(providerId: number): Promise<any> {
    if (isNaN(providerId)) {
      this.errorHandler.throwError('ProviderId is invalid.');
    }
    const clientId = this.request['user'].clientId;
    if (!clientId) {
      this.errorHandler.throwError('ClientId is not found.');
    }
    const databaseParams: DatabaseParam[] = [
      {
        inputParamName: 'ProviderId',
        parameterValue: this.mssql.convertToString(providerId)
      },
      {
        inputParamName: 'ClientId',
        parameterValue: this.mssql.convertToString(clientId)
      }
    ];

    const dbQuery: string = this.mssql.getQuery(
      databaseParams,
      'UspGetProviderSubjects'
    );

    try {
      const resultSet = await this.database.query(dbQuery);
      const resultObj = this.mssql.parseMultiResultSet(resultSet);
      return resultObj ? (resultObj as ClientProviderMessage[]) : [];
    } catch (error) {
      this.errorHandler.throwError(error);
    }
  }

  // Posts new subject.
  async postNewSubject(@Body() subject: SubjectDto): Promise<any> {
    const clientId = this.request['user'].clientId;
    if (!clientId) {
      this.errorHandler.throwError('Only client can create a subject.');
    }
    if (!subject.providerId) {
      this.errorHandler.throwError('ProviderId must be supplied.');
    }

    const databaseParams: DatabaseParam[] = [
      {
        inputParamName: 'Subject',
        bulkParamValue: [subject],
        tableType: TableTypes.SubjectTableType
      },
      {
        inputParamName: 'ClientId',
        parameterValue: this.mssql.convertToString(clientId)
      }
    ];

    const dbQuery: string = this.mssql.getQuery(
      databaseParams,
      'UspInsertSubject'
    );
    try {
      const resultSet = await this.database.query(dbQuery);
      const resultObj = this.mssql.parseSingleResultSet(resultSet);
      return resultObj ? resultObj : { success: false };
    } catch (error) {
      this.errorHandler.throwError(error);
    }
  }
}

import { Body, Inject, Injectable } from '@nestjs/common';
import { REQUEST } from '@nestjs/core';
import { InjectRepository } from '@nestjs/typeorm';
import { ErrorHandler } from 'src/Helper/ErrorHandler';
import { AttachmentsService } from 'src/attachments/attachments.service';
import { AttachmentMessageDto } from 'src/attachments/model/dto';
import {
  MessageAttachmentWithThumbnailResult,
  ThumbnailObject
} from 'src/attachments/model/result';
import { DatabaseEntity } from 'src/database/entities/database';
import { TableTypes } from 'src/database/table-types/table-types';
import { DatabaseParam } from 'src/database/typeorm/database-params';
import { MsSql } from 'src/database/typeorm/mssql';
import { PostedMessage } from 'src/gateway/dto';
import { Repository } from 'typeorm';
import { MessageDto, SubjectDto } from './model/dto/dto';
import {
  Attachment,
  ClientProviderMessage,
  Message,
  MessageById
} from './model/result/result';

@Injectable()
export class MessagesService {
  constructor(
    @InjectRepository(DatabaseEntity)
    private database: Repository<null>,
    private mssql: MsSql,
    private errorHandler: ErrorHandler,
    private attachmentsService: AttachmentsService,
    @Inject(REQUEST) private readonly request: Request
  ) {}

  // Posts a message with attachment.
  async postAttachmentMessage(
    attachmentMessage: AttachmentMessageDto
  ): Promise<any> {
    const messageDto: MessageDto = {
      messageId: null,
      message: attachmentMessage.message,
      isAttachment: true,
      createdBy: this.request['user'].userId,
      createdAt: null,
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
        viewed: resultObj.viewed,
        error: null,
        attachments: []
      };
      return postedMessage;
    } catch (error) {
      this.errorHandler.throwDatabaseError(error);
    }
  }

  // Gets subject list between provider and a client.
  async getProviderClientSubjects(clientId: number): Promise<any> {
    if (!clientId || isNaN(clientId)) {
      this.errorHandler.throwCustomError('clientId is not provided.');
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
      this.errorHandler.throwDatabaseError(error);
    }
  }

  // Gets messages based on the subject id.
  async getSubjectMessages(
    subjectId: number,
    chunkCount: number,
    chunkNum: number
  ): Promise<Message[]> {
    if (!subjectId || isNaN(subjectId)) {
      this.errorHandler.throwCustomError(
        'subjectId is required and must be a number.'
      );
    }
    if (!chunkCount || isNaN(chunkCount)) {
      this.errorHandler.throwCustomError(
        'chunkCount is required and must be a number.'
      );
    }
    if (!chunkNum || isNaN(chunkNum)) {
      this.errorHandler.throwCustomError(
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
      const subjectMessages = this.mssql.parseMultiResultSet(
        resultSet
      ) as Message[];

      // Get message atatachments.
      const messageIdsArr: number[] = subjectMessages.map((m) => m.messageId);
      const messageAttachmentsArr: MessageAttachmentWithThumbnailResult[] =
        await this.attachmentsService.getMessageAttachments(messageIdsArr);

      subjectMessages.forEach((sm) => {
        const relatedAttachments = messageAttachmentsArr.filter(
          (ma) => ma.messageId === sm.messageId
        );
        const attachments: Attachment[] = [];
        relatedAttachments.forEach((ra) => {
          attachments.push({
            messageAttachmentId: ra.messageAttachmentId,
            attachmentOriginalName: ra.originalName,
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
        await this.attachmentsService.getThumbnails(allThumbnailIdsArr);

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
      this.errorHandler.throwDatabaseError(error);
    }
  }

  // Gets subject list between the selected provider and a client.
  async getClientProviderSubjects(providerId: number): Promise<any> {
    if (isNaN(providerId)) {
      this.errorHandler.throwCustomError('ProviderId is invalid.');
    }
    const clientId = this.request['user'].clientId;
    if (!clientId) {
      this.errorHandler.throwCustomError('ClientId is not found.');
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
      this.errorHandler.throwDatabaseError(error);
    }
  }

  // Posts new subject.
  async postNewSubject(@Body() subject: SubjectDto): Promise<any> {
    const clientId = this.request['user'].clientId;
    if (!clientId) {
      this.errorHandler.throwCustomError('Only client can create a subject.');
    }
    if (!subject.providerId) {
      this.errorHandler.throwCustomError('ProviderId must be supplied.');
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
      this.errorHandler.throwDatabaseError(error);
    }
  }
}

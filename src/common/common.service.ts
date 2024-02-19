import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { S3 } from 'aws-sdk';
import { ErrorHandler } from 'src/Helper/ErrorHandler';
import {
  AttachmentThumbnailResult,
  MessageAttachmentWithThumbnailResult,
  ThumbnailObject
} from 'src/attachments/model/result';
import { DatabaseEntity } from 'src/database/entities/database';
import { PkDto } from 'src/database/table-types/shared-dto';
import { TableTypes } from 'src/database/table-types/table-types';
import { DatabaseParam } from 'src/database/typeorm/database-params';
import { MsSql } from 'src/database/typeorm/mssql';
import { Attachment, MessageById } from 'src/messages/model/result/result';
import { Repository } from 'typeorm';

@Injectable()
export class CommonService {
  public constructor(
    @InjectRepository(DatabaseEntity)
    private database: Repository<null>,
    private mssql: MsSql,
    private errorHandler: ErrorHandler
  ) {}

  public readonly s3 = new S3({
    accessKeyId: process.env.AWS_S3_ACCESS_KEY,
    secretAccessKey: process.env.AWS_S3_KEY_SECRET,
    endpoint: process.env.AWS_S3_ENDPOINT,
    s3ForcePathStyle: true
  });

  // Gets a single message with messageId.
  public async getMessageById(messageId: number): Promise<MessageById> {
    const databaseParams: DatabaseParam[] = [
      {
        inputParamName: 'MessageId',
        parameterValue: this.mssql.convertToString(messageId)
      }
    ];

    const dbQuery: string = this.mssql.getQuery(
      databaseParams,
      'UspGetMessageById'
    );

    try {
      const resultSet = await this.database.query(dbQuery);
      const messageRaw = this.mssql.parseSingleResultSet(resultSet);
      const message: MessageById = {
        subjectId: messageRaw.subjectId,
        replyToMessage: {
          replyToMessageId: messageRaw.replyToMessageId,
          replyToMessage: messageRaw.replyToMessage,
          originalMessageCreatedBy: messageRaw.originalMessageCreatedBy,
          thumbnailUrl: this.getSignedUrl(
            messageRaw.thumbnailS3Bucket,
            messageRaw.thumbnailS3Key
          ),
          attachmentOriginalName: messageRaw.attachmentOriginalName
        },
        messageId: messageRaw.messageId,
        message: messageRaw.message,
        isAttachment: messageRaw.isAttachment,
        createdBy: messageRaw.createdBy,
        createdAt: messageRaw.createdAt,
        lastUpdatedAt: messageRaw.lastUpdatedAt,
        viewed: messageRaw.viewed,
        attachments: []
      };

      // Get message atatachments.
      const messageAttachmentArr: MessageAttachmentWithThumbnailResult[] =
        await this.getMessageAttachments([messageId]);

      messageAttachmentArr.forEach((ma) => {
        const attachment: Attachment = {
          attachmentOriginalName: ma.originalName,
          attachmentMimeType: ma.mimeType,
          attachmentThumbnailId: ma.attachmentThumbnailId,
          messageAttachmentId: ma.messageAttachmentId,
          thumbnailUrl: null
        };
        message.attachments.push(attachment);
      });

      // Get attachment thumbnails.
      const messageThumbnaildIdArr: number[] = message.attachments
        .filter((attachment) => attachment.attachmentThumbnailId)
        .map((attachment) => attachment.attachmentThumbnailId);

      const allThumbnails: ThumbnailObject[] = await this.getThumbnails(
        messageThumbnaildIdArr
      );

      message.attachments.forEach((attachment) => {
        attachment.thumbnailUrl =
          allThumbnails.find(
            (t) => t.attachmentThumbnailId === attachment.attachmentThumbnailId
          )?.thumbnailUrl ?? null;
      });

      return message;
    } catch (error) {
      this.errorHandler.throwCustomError(error);
    }
  }

  // Gets message attachments by messageId array.
  public async getMessageAttachments(
    messageIdsArr: number[]
  ): Promise<MessageAttachmentWithThumbnailResult[]> {
    const messageIdPkDto: PkDto[] = [];
    messageIdsArr.forEach((messageId) => {
      messageIdPkDto.push({
        pk: messageId
      });
    });
    const databaseParams: DatabaseParam[] = [
      {
        tableType: TableTypes.PkTableType,
        inputParamName: 'MessageIds',
        bulkParamValue: messageIdPkDto
      }
    ];
    const dbQuery: string = this.mssql.getQuery(
      databaseParams,
      'UspGetMessageAttachments'
    );
    try {
      const resultSet = await this.database.query(dbQuery);
      const resultObj = this.mssql.parseMultiResultSet(
        resultSet
      ) as MessageAttachmentWithThumbnailResult[];
      return resultObj ? resultObj : [];
    } catch (error) {
      this.errorHandler.throwDatabaseError(error);
    }
  }

  // Gets thumbnail objects.
  public async getThumbnails(
    thumbnailIdArr: number[]
  ): Promise<ThumbnailObject[]> {
    const pkDto: PkDto[] = [];
    thumbnailIdArr.forEach((id) => {
      pkDto.push({ pk: id });
    });
    const databaseParams: DatabaseParam[] = [
      {
        tableType: TableTypes.PkTableType,
        inputParamName: 'AttachmentThumbnailIds',
        bulkParamValue: pkDto
      }
    ];

    const dbQuery: string = this.mssql.getQuery(
      databaseParams,
      'UspGetThumbnails'
    );

    const resultSet = await this.database.query(dbQuery);
    const resultObjArr = this.mssql.parseMultiResultSet(
      resultSet
    ) as AttachmentThumbnailResult[];

    const resultArray = [];
    // Get thumbnail object for each item in array.
    resultObjArr.forEach((thumbnail) => {
      const thumbnailResult: ThumbnailObject = thumbnail;
      thumbnailResult.thumbnailUrl = this.getSignedUrl(
        thumbnail.s3Bucket,
        thumbnail.s3Key
      );
      resultArray.push(thumbnailResult);
    });

    return resultArray;
  }

  // Reads attachment from S3 cloud bucket.
  public getSignedUrl(bucket: string, key: string): string {
    let signedUrl = null;
    if (bucket && key) {
      const params = {
        Bucket: bucket,
        Key: key,
        Expires: 600 // Expires in 600 seconds after creation.
      };
      signedUrl = this.s3.getSignedUrl('getObject', params);
    }

    return signedUrl;
  }
}

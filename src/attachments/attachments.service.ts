import { Inject, Injectable } from '@nestjs/common';
import { REQUEST } from '@nestjs/core';
import { InjectRepository } from '@nestjs/typeorm';
import { S3 } from 'aws-sdk';
import * as sharp from 'sharp';
import { ErrorHandler } from 'src/Helper/ErrorHandler';
import { DatabaseEntity } from 'src/database/entities/database';
import { PkDto } from 'src/database/table-types/shared-dto';
import { TableTypes } from 'src/database/table-types/table-types';
import { DatabaseParam } from 'src/database/typeorm/database-params';
import { MsSql } from 'src/database/typeorm/mssql';
import { PostedMessage } from 'src/gateway/dto';
import { MessagesService } from 'src/messages/messages.service';
import { Attachment, MessageById } from 'src/messages/model/result/result';
import { Repository } from 'typeorm';
import { v4 as uuid } from 'uuid';
import { AttachmentThumbnailDto, MessageAttachmentDto } from './model/dto';
import {
  AttachmentThumbnailResult,
  AttachmentUrl,
  MessageAttachmentResult,
  MessageAttachmentWithThumbnailResult,
  ThumbnailObject
} from './model/result';

@Injectable()
export class AttachmentsService {
  public constructor(
    @InjectRepository(DatabaseEntity)
    private database: Repository<null>,
    private mssql: MsSql,
    private errorHandler: ErrorHandler,
    @Inject(REQUEST) private readonly request: Request
  ) {}

  public readonly s3 = new S3({
    accessKeyId: process.env.AWS_S3_ACCESS_KEY,
    secretAccessKey: process.env.AWS_S3_KEY_SECRET,
    endpoint: process.env.AWS_S3_ENDPOINT,
    s3ForcePathStyle: true
  });

  // Gets attachment url from aws.
  public async getAttachmentUrl(
    messageAttachmentId: number
  ): Promise<AttachmentUrl> {
    if (!messageAttachmentId || isNaN(messageAttachmentId)) {
      this.errorHandler.throwCustomError(
        'messageAttachmentId is not provided.'
      );
    }

    const databaseParams: DatabaseParam[] = [
      {
        inputParamName: 'MessageAttachmentId',
        parameterValue: this.mssql.convertToString(messageAttachmentId)
      },
      {
        inputParamName: 'ClientId',
        parameterValue: this.mssql.convertToString(
          this.request['user'].clientId
        )
      },
      {
        inputParamName: 'ProviderId',
        parameterValue: this.mssql.convertToString(
          this.request['user'].providerId
        )
      }
    ];

    const dbQuery: string = this.mssql.getQuery(
      databaseParams,
      'UspGetMessageAttachmentById'
    );

    let messageAttachment: MessageAttachmentResult = null;
    try {
      const resultSet = await this.database.query(dbQuery);
      messageAttachment = this.mssql.parseSingleResultSet(
        resultSet
      ) as MessageAttachmentResult;
    } catch (error) {
      this.errorHandler.throwDatabaseError(error);
    }

    if (messageAttachment) {
      const attachmentUrl: AttachmentUrl = {
        attachmentUrl: await this.readAttachmentFromCloud(
          messageAttachment.s3Bucket,
          messageAttachment.s3Key
        )
      };
      return attachmentUrl;
    } else {
      this.errorHandler.throwCustomError('Attachment not found.');
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
      const thumbnailObj = this.readThumbnailFromCloud(
        thumbnail.s3Bucket,
        thumbnail.s3Key
      ).then((result) => {
        const thumbnailResult: ThumbnailObject = thumbnail;
        thumbnailResult.thumbnailUrl = result;
        resultArray.push(thumbnailResult);
      });
    });

    return resultArray;
  }

  // Uploads multiple files as attachments.
  public async uploadMultipleFiles(
    file: Express.Multer.File,
    messageId: number,
    thumbnailBlob: Blob
  ): Promise<any> {
    if (!messageId || isNaN(messageId)) {
      this.errorHandler.throwCustomError('message is not provided or invalid.');
    }
    // Required to access THIS object within promise.
    try {
      // Upload file to cloud.
      // Trim any blank space in file name.
      file.originalname = file.originalname.replaceAll(' ', '');
      const newUuid = uuid();
      const uploadedAttachment = await this.uploadFileToCloud(
        file,
        `${newUuid}-${file.originalname}`
      );
      // Save as attachment in db.
      const attachment = await this.saveAttachmentDetails(
        messageId,
        file,
        newUuid,
        uploadedAttachment.Key,
        uploadedAttachment.Bucket,
        uploadedAttachment.Location
      );

      if (!thumbnailBlob) {
        // Create a thumbnail of the attachment.
        const fileMimeType = file?.mimetype?.toLowerCase();
        if (fileMimeType.includes('image')) {
          const thumbnailUuid = uuid();
          const thumbnailBuffer = await sharp(file.buffer)
            .resize(200, 200)
            .toBuffer();
          // Upload thumbnail to cloud.
          const uploadedThumbnail = await this.uploadThumbnailToCloud(
            thumbnailBuffer,
            `${thumbnailUuid}-${file.originalname}`
          );

          await this.saveThumbnailDetails(
            attachment.messageAttachmentId,
            file.mimetype,
            thumbnailUuid,
            uploadedThumbnail.Key,
            uploadedThumbnail.Bucket,
            uploadedThumbnail.Location
          );
        }
      } else {
        const thumbnailUuid = uuid();

        const uploadedThumbnail = await this.uploadThumbnailToCloud(
          Buffer.from(await thumbnailBlob.arrayBuffer()),
          `${thumbnailUuid}-${file.originalname}`
        );

        await this.saveThumbnailDetails(
          attachment.messageAttachmentId,
          file.mimetype,
          thumbnailUuid,
          uploadedThumbnail.Key,
          uploadedThumbnail.Bucket,
          uploadedThumbnail.Location
        );
      }

      const message: MessageById = await this.getMessageById(messageId);
      const postedMessage: PostedMessage = {
        subjectId: message.subjectId,
        messageId: message.messageId,
        message: message.message,
        isAttachment: message.isAttachment,
        createdBy: message.createdBy,
        createdAt: message.createdAt,
        viewed: message.viewed,
        error: null,
        attachments: message.attachments
      };

      return postedMessage;
    } catch (error) {
      this.errorHandler.throwCustomError('Unable to upload attachment.');
    }
  }

  // Uploads file to S3 cloud bucket.
  private async uploadFileToCloud(
    file: Express.Multer.File,
    uuid: string
  ): Promise<any> {
    const params: S3.PutObjectRequest = {
      Bucket: process.env.AWS_S3_BUCKET_NAME,
      Key: `${process.env.AWS_S3_FOLDER_NAME}/${uuid}`,
      Body: file.buffer
    };
    const uploadResult = await this.s3.upload(params).promise();
    return uploadResult;
  }

  // Reads thumbnail from S3 cloud bucket.
  public async readThumbnailFromCloud(
    bucket: string,
    key: string
  ): Promise<string> {
    const params = {
      Bucket: bucket,
      Key: key,
      Expires: 600 // Expires in 600 seconds after creation.
    };
    const uploadResult = this.s3.getSignedUrl('getObject', params);
    return uploadResult;
  }

  // Reads attachment from S3 cloud bucket.
  public async readAttachmentFromCloud(
    bucket: string,
    key: string
  ): Promise<string> {
    const params = {
      Bucket: bucket,
      Key: key,
      Expires: 600 // Expires in 600 seconds after creation.
    };
    const uploadResult = this.s3.getSignedUrl('getObject', params);
    return uploadResult;
  }

  // Uploads thumbnail to S3 cloud bucket.
  private async uploadThumbnailToCloud(
    buffer: Buffer,
    uuid: string
  ): Promise<any> {
    try {
      const params: S3.PutObjectRequest = {
        Bucket: process.env.AWS_S3_BUCKET_NAME,
        Key: `${process.env.AWS_S3_THUMBNAIL_FOLDER}/${uuid}`,
        Body: buffer
      };
      const uploadResult = await this.s3.upload(params).promise();
      return uploadResult;
    } catch (error) {
      console.log(error);
    }
  }

  // Saves thumbnail details in DB.
  private async saveThumbnailDetails(
    messageAttachmentId: number,
    mimeType: string,
    uuid: string,
    s3Key: string,
    s3Bucket: string,
    location: string
  ): Promise<AttachmentThumbnailResult> {
    const attachmentThumbnailDto: AttachmentThumbnailDto = {
      attachmentThumbnailId: null,
      messageAttachmentId: messageAttachmentId,
      mimeType: mimeType,
      uuid: uuid,
      s3Key: s3Key,
      s3Bucket: s3Bucket,
      location: location
    };

    const databaseParams: DatabaseParam[] = [
      {
        tableType: TableTypes.AttachmentThumbnailTableType,
        inputParamName: 'AttachmentThumbnail',
        bulkParamValue: [attachmentThumbnailDto]
      }
    ];

    const dbQuery: string = this.mssql.getQuery(
      databaseParams,
      'UpsInsertAttachmentThumbnail'
    );

    const resultSet = await this.database.query(dbQuery);
    const resultObj = this.mssql.parseSingleResultSet(
      resultSet
    ) as AttachmentThumbnailResult;

    return resultObj;
  }

  // Saves attachment details in DB.
  private async saveAttachmentDetails(
    messageId: number,
    file: Express.Multer.File,
    uuid: string,
    s3Key: string,
    s3Bucket: string,
    location: string
  ): Promise<MessageAttachmentResult> {
    const messageAttachmentDto: MessageAttachmentDto = {
      messageAttachmentId: null,
      messageId: messageId,
      originalName: file.originalname,
      mimeType: file.mimetype,
      uuid: uuid,
      s3Key: s3Key,
      s3Bucket: s3Bucket,
      location: location
    };

    const databaseParams: DatabaseParam[] = [
      {
        inputParamName: 'MessageAttachment',
        tableType: TableTypes.MessageAttachmentTableType,
        bulkParamValue: [messageAttachmentDto]
      }
    ];

    const dbQuery: string = this.mssql.getQuery(
      databaseParams,
      'UspInsertMessageAttachment'
    );

    const resultSet = await this.database.query(dbQuery);
    const resultObj = this.mssql.parseSingleResultSet(
      resultSet
    ) as MessageAttachmentResult;

    return resultObj;
  }

  // Gets a single message with messageId.
  private async getMessageById(messageId: number): Promise<MessageById> {
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
      const message = this.mssql.parseSingleResultSet(resultSet) as MessageById;
      message.attachments = [];

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
}

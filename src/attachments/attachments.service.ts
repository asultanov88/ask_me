import { Inject, Injectable } from '@nestjs/common';
import { REQUEST } from '@nestjs/core';
import { InjectRepository } from '@nestjs/typeorm';
import { S3 } from 'aws-sdk';
import * as sharp from 'sharp';
import { ErrorHandler } from 'src/Helper/ErrorHandler';
import { CommonService } from 'src/common/common.service';
import { DatabaseEntity } from 'src/database/entities/database';
import { TableTypes } from 'src/database/table-types/table-types';
import { DatabaseParam } from 'src/database/typeorm/database-params';
import { MsSql } from 'src/database/typeorm/mssql';
import { PostedMessage } from 'src/gateway/dto';
import { MessageById } from 'src/messages/model/result/result';
import { Repository } from 'typeorm';
import { v4 as uuid } from 'uuid';
import { AttachmentThumbnailDto, MessageAttachmentDto } from './model/dto';
import {
  AttachmentThumbnailResult,
  AttachmentUrl,
  MessageAttachmentResult
} from './model/result';

@Injectable()
export class AttachmentsService {
  public constructor(
    @InjectRepository(DatabaseEntity)
    private database: Repository<null>,
    private mssql: MsSql,
    private errorHandler: ErrorHandler,
    private commonService: CommonService,
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
        attachmentUrl: this.commonService.getSignedUrl(
          messageAttachment.s3Bucket,
          messageAttachment.s3Key
        )
      };
      return attachmentUrl;
    } else {
      this.errorHandler.throwCustomError('Attachment not found.');
    }
  }

  // Uploads multiple files as attachments.
  public async uploadFile(
    file: Express.Multer.File,
    messageId: number,
    thumbnailBlob: string
  ): Promise<any> {
    if (!messageId || isNaN(messageId)) {
      this.errorHandler.throwCustomError('message is not provided or invalid.');
    }

    const thumbnailExtension = '.jpg';
    const thumbnailName =
      file.originalname.replace(/\.[^/.]+$/, '') + thumbnailExtension;

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
            .resize(200, 200, {
              fit: 'inside'
            })
            .jpeg({ quality: 80 })
            .toBuffer();
          // Upload thumbnail to cloud.
          const uploadedThumbnail = await this.uploadThumbnailToCloud(
            thumbnailBuffer,
            `${thumbnailUuid}-${thumbnailName}`
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
        // Decrypt blob.
        const bufferObj = Buffer.from(
          thumbnailBlob.replaceAll('data:image/png;base64,', ''),
          'base64'
        );

        const uploadedThumbnail = await this.uploadThumbnailToCloud(
          bufferObj,
          `${thumbnailUuid}-${thumbnailName}`
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

      const message: MessageById =
        await this.commonService.getMessageById(messageId);
      const postedMessage: PostedMessage = {
        subjectId: message.subjectId,
        messageId: message.messageId,
        message: message.message,
        isAttachment: message.isAttachment,
        createdBy: message.createdBy,
        createdAt: message.createdAt,
        viewed: message.viewed,
        error: null,
        attachments: message.attachments,
        replyToMessage: message.replyToMessage
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

  // Uploads thumbnail to S3 cloud bucket.
  private async uploadThumbnailToCloud(
    buffer: Buffer,
    uuid: string
  ): Promise<any> {
    const params: S3.PutObjectRequest = {
      Bucket: process.env.AWS_S3_BUCKET_NAME,
      Key: `${process.env.AWS_S3_THUMBNAIL_FOLDER}/${uuid}`,
      Body: buffer
    };
    const uploadResult = await this.s3.upload(params).promise();
    return uploadResult;
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
}

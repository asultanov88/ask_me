import { Inject, Injectable } from '@nestjs/common';
import { REQUEST } from '@nestjs/core';
import { InjectRepository } from '@nestjs/typeorm';
import { S3 } from 'aws-sdk';
import { ErrorHandler } from 'src/Helper/ErrorHandler';
import { DatabaseEntity } from 'src/database/entities/database';
import { MsSql } from 'src/database/typeorm/mssql';
import { Repository } from 'typeorm';
import { v4 as uuid } from 'uuid';
import { MessageDto } from 'src/messages/model/dto/dto';
import { DatabaseParam } from 'src/database/typeorm/database-params';
import { TableTypes } from 'src/database/table-types/table-types';
import { PostedMessage } from 'src/gateway/dto';
import { GatewayService } from 'src/gateway/gateway.service';
import {
  AttachmentMessageDto,
  AttachmentThumbnailDto,
  MessageAttachmentDto
} from './model/dto';
import {
  AttachmentThumbnailResult,
  MessageAttachmentResult,
  ThumbnailObject
} from './model/result';
import * as sharp from 'sharp';
import { PkDto } from 'src/database/table-types/shared-dto';

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
    files: Express.Multer.File[],
    message: AttachmentMessageDto
  ): Promise<any> {
    // Required to access THIS object within promise.
    var that = this;
    return new Promise<PostedMessage>(async function (resolve, reject) {
      try {
        let postedMessage: PostedMessage = null;
        // Insert the message first.
        const messageDto: MessageDto = {
          messageId: null,
          message: message.message,
          isAttachment: true,
          createdBy: that.request['user'].userId,
          createdAt: null,
          viewed: false
        };

        const databaseParams: DatabaseParam[] = [
          {
            inputParamName: 'SubjectId',
            parameterValue: that.mssql.convertToString(message.subjectId)
          },
          {
            inputParamName: 'Message',
            tableType: TableTypes.MessageTableType,
            bulkParamValue: [messageDto]
          }
        ];

        const dbQuery: string = that.mssql.getQuery(
          databaseParams,
          'UspInsertMessage'
        );

        const resultSet = await that.database.query(dbQuery);
        const resultObj = that.mssql.parseSingleResultSet(resultSet);
        // MessageId of the inserted message.
        const messageId: number = resultObj.messageId;

        postedMessage = {
          subjectId: message.subjectId,
          messageId: messageId,
          message: resultObj.message,
          isAttachment: resultObj.isAttachment,
          createdBy: resultObj.createdBy,
          createdAt: resultObj.createdAt,
          viewed: resultObj.viewed,
          error: null,
          attachments: []
        };

        const promiseArray = [];

        // Upload file to cloud.
        files.forEach((file) => {
          promiseArray.push(
            new Promise<void>(function (resolve, reject) {
              try {
                const newUuid = uuid();
                that
                  .uploadFileToCloud(file, `${newUuid}-${file.originalname}`)
                  .then((uploadedAttachment) => {
                    // Save as attachment in db.
                    that
                      .saveAttachmentDetails(
                        messageId,
                        file,
                        newUuid,
                        uploadedAttachment.Key,
                        uploadedAttachment.Bucket,
                        uploadedAttachment.Location
                      )
                      .then(async (attachment) => {
                        // Create a thumbnail of the attachment.
                        const fileMimeType = file?.mimetype?.toLowerCase();
                        if (
                          fileMimeType.includes('jpeg') ||
                          fileMimeType.includes('jpg') ||
                          fileMimeType.includes('png') ||
                          fileMimeType.includes('gif') ||
                          fileMimeType.includes('tiff')
                        ) {
                          const thumbnailUuid = uuid();
                          const thumbnailBuffer = await sharp(file.buffer)
                            .resize(200, 200)
                            .toBuffer();
                          // Upload thumbnail to cloud.
                          that
                            .uploadThumbnailToCloud(
                              thumbnailBuffer,
                              `${thumbnailUuid}-${file.originalname}`
                            )
                            .then((uploadedThumbnail) => {
                              // Save uploaded thumbnail details in DB.
                              that
                                .saveThumbnailDetails(
                                  attachment.messageAttachmentId,
                                  file.mimetype,
                                  thumbnailUuid,
                                  uploadedThumbnail.Key,
                                  uploadedThumbnail.Bucket,
                                  uploadedThumbnail.Location
                                )
                                .then((savedThumbnail) => {
                                  postedMessage.attachments.push({
                                    messageAttachmentId:
                                      attachment.messageAttachmentId,
                                    attachmentThumbnailId:
                                      savedThumbnail.attachmentThumbnailId,
                                    attachmentOriginalName:
                                      attachment.originalName
                                  });
                                  resolve();
                                });
                            });
                        } else {
                          // Thumbnail cannot be made, save it as it is.
                          postedMessage.attachments.push({
                            messageAttachmentId: attachment.messageAttachmentId,
                            attachmentOriginalName: attachment.originalName,
                            attachmentThumbnailId: null
                          });
                          resolve();
                        }
                      });
                  });
              } catch (error) {
                that.errorHandler.throwCustomError(error);
                reject();
              }
            })
          );
        });

        Promise.all(promiseArray).then(async () => {
          // Get thumnbail object for each attachment.
          let thumbnaildIdArr: number[] = postedMessage.attachments
            .filter((attachment) => attachment.attachmentThumbnailId)
            .map((attachment) => attachment.attachmentThumbnailId);

          const thumbnailResult = await that.getThumbnails(thumbnaildIdArr);
          postedMessage.attachments.forEach((attachment) => {
            const attachmentThumbnail = thumbnailResult.find(
              (thumnbnail) =>
                thumnbnail.attachmentThumbnailId ===
                attachment.attachmentThumbnailId
            );
            attachment.thumbnailUrl = attachmentThumbnail?.thumbnailUrl ?? null;
          });
          resolve(postedMessage);
        });
      } catch (error) {
        that.errorHandler.throwCustomError('Unable to upload attachment.');
        reject();
      }
    });
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
  private async readThumbnailFromCloud(
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

import { Inject, Injectable } from '@nestjs/common';
import { REQUEST } from '@nestjs/core';
import { InjectRepository } from '@nestjs/typeorm';
import { S3 } from 'aws-sdk';
import { ErrorHandler } from 'src/Helper/ErrorHandler';
import { DatabaseEntity } from 'src/database/entities/database';
import { MsSql } from 'src/database/typeorm/mssql';
import { Repository } from 'typeorm';
import { v4 as uuid } from 'uuid';
import { MessageAttachmentDto, MessageDto } from 'src/messages/model/dto/dto';
import { DatabaseParam } from 'src/database/typeorm/database-params';
import { TableTypes } from 'src/database/table-types/table-types';
import { PostedMessage } from 'src/gateway/dto';
import { GatewayService } from 'src/gateway/gateway.service';
import { AttachmentMessageDto } from './model/dto';
import { MessageAttachmentResult } from './model/result';

@Injectable()
export class AttachmentsService {
  public constructor(
    @InjectRepository(DatabaseEntity)
    private database: Repository<null>,
    private mssql: MsSql,
    private errorHandler: ErrorHandler,
    private gatewayService: GatewayService,
    @Inject(REQUEST) private readonly request: Request
  ) {}

  public readonly s3 = new S3({
    accessKeyId: process.env.AWS_S3_ACCESS_KEY,
    secretAccessKey: process.env.AWS_S3_KEY_SECRET,
    endpoint: process.env.AWS_S3_ENDPOINT,
    s3ForcePathStyle: true
  });

  async uploadMultipleFiles(
    files: Express.Multer.File[],
    message: AttachmentMessageDto
  ): Promise<any> {
    var that = this;
    return new Promise<PostedMessage>(async function (resolve, reject) {
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
            const newUuid = uuid();
            const uploadResult = that
              .uploadFileToCloud(file, newUuid)
              .then((uploadResult) => {
                // Save as attachment in db.
                that
                  .saveAttachmentDetails(
                    messageId,
                    file,
                    newUuid,
                    uploadResult.Key,
                    uploadResult.Bucket,
                    uploadResult.Location
                  )
                  .then((attachment) => {
                    postedMessage.attachments.push({
                      messageAttachmentId: attachment.messageAttachmentId
                    });
                    resolve();
                  });
              });
          })
        );
      });

      Promise.all(promiseArray).then(() => {
        resolve(postedMessage);
      });
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

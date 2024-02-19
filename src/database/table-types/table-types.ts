import { UserDto } from 'src/users/models/dto';
import { PkDto } from './shared-dto';
import {
  ProviderDetailsDto,
  ProviderWorkHourDto
} from 'src/providers/models/dto';
import { MessageDto, SubjectDto } from 'src/messages/model/dto/dto';
import {
  AttachmentThumbnailDto,
  MessageAttachmentDto
} from 'src/attachments/model/dto';

export class TableTypes {
  public static UserTableType: TableType = {
    typeName: 'UserTableType',
    fields: [
      'userId',
      'firstName',
      'lastName',
      'email',
      'password',
      'createdAt',
      'inactive',
      'isClient',
      'isProvider'
    ],
    dto: new UserDto()
  };

  public static PkTableType: TableType = {
    typeName: 'PkTableType',
    fields: ['pk'],
    dto: new PkDto()
  };

  public static ProviderDetailTableType: TableType = {
    typeName: 'ProviderDetailsTableType',
    fields: [
      'providerDetailsId',
      'providerId',
      'companyName',
      'address',
      'phoneNumber',
      'description'
    ],
    dto: new ProviderDetailsDto()
  };

  public static ProviderWorkHourTableType: TableType = {
    typeName: 'ProviderWorkHourTableType',
    fields: [
      'providerWorkHourId',
      'providerId',
      'fromLkWorkHourId',
      'toLkWorkHourId'
    ],
    dto: new ProviderWorkHourDto()
  };

  public static SubjectTableType: TableType = {
    typeName: 'SubjectTableType',
    fields: ['subjectId', 'clientProviderId', 'providerId', 'title', 'deleted'],
    dto: new SubjectDto()
  };

  public static MessageTableType: TableType = {
    typeName: 'MessageTableType',
    fields: [
      'messageId',
      'message',
      'isAttachment',
      'createdBy',
      'createdAt',
      'lastUpdatedAt',
      'viewed'
    ],
    dto: new MessageDto()
  };

  public static MessageAttachmentTableType: TableType = {
    typeName: 'MessageAttachmentTableType',
    fields: [
      'messageAttachmentId',
      'messageId',
      'originalName',
      'mimeType',
      'uuid',
      's3Key',
      's3Bucket',
      'location'
    ],
    dto: new MessageAttachmentDto()
  };

  public static AttachmentThumbnailTableType: TableType = {
    typeName: 'AttachmentThumbnailTableType',
    fields: [
      'attachmentThumbnailId',
      'messageAttachmentId',
      'mimeType',
      'uuid',
      's3Key',
      's3Bucket',
      'location'
    ],
    dto: new AttachmentThumbnailDto()
  };
}

export interface TableType {
  typeName: string;
  fields: string[];
  dto: any;
}

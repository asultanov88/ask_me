import {
  Body,
  Controller,
  Get,
  Post,
  Query,
  UploadedFile,
  UseInterceptors
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { AttachmentsService } from './attachments.service';
import { AttachmentUrl } from './model/result';

@Controller('attachments')
export class AttachmentsController {
  public constructor(private readonly attachmentsService: AttachmentsService) {}

  @Post('upload')
  @UseInterceptors(FileInterceptor('file'))
  async uploadFile(@UploadedFile() file, @Body() body): Promise<any> {
    // Message object is in string format.
    const messageId: number = parseInt(body.messageId, 10);
    const thumbnailBlob: string =
      body.thumbnailBlob?.toString()?.trim().length > 0
        ? body.thumbnailBlob
        : null;

    return await this.attachmentsService.uploadFile(
      file,
      messageId,
      thumbnailBlob
    );
  }

  @Get('attachment-url')
  async getAttachmentUrl(@Query() query): Promise<AttachmentUrl> {
    return await this.attachmentsService.getAttachmentUrl(
      query.messageAttachmentId
    );
  }
}

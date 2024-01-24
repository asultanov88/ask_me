import {
  Body,
  Controller,
  Get,
  Post,
  Query,
  UploadedFiles,
  UseInterceptors
} from '@nestjs/common';
import { FilesInterceptor } from '@nestjs/platform-express';
import { AttachmentsService } from './attachments.service';
import { AttachmentUrl } from './model/result';

@Controller('attachments')
export class AttachmentsController {
  public constructor(private readonly attachmentsService: AttachmentsService) {}

  @Post('upload')
  @UseInterceptors(FilesInterceptor('files', 100))
  async uploadMultipleFiles(
    @UploadedFiles() files,
    @Body() body
  ): Promise<any> {
    // Message object is in string format.

    const messageId: number = parseInt(body.messageId, 10);
    return await this.attachmentsService.uploadMultipleFiles(files, messageId);
  }

  @Get('attachment-url')
  async getAttachmentUrl(@Query() query): Promise<AttachmentUrl> {
    return await this.attachmentsService.getAttachmentUrl(
      query.messageAttachmentId
    );
  }
}

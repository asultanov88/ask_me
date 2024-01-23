import {
  Body,
  Controller,
  Get,
  Post,
  Query,
  UploadedFile,
  UploadedFiles,
  UseInterceptors
} from '@nestjs/common';
import { FileInterceptor, FilesInterceptor } from '@nestjs/platform-express';
import { AttachmentsService } from './attachments.service';
import { AttachmentMessageDto, ThumbnailIds } from './model/dto';
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
    const message = JSON.parse(body.message) as AttachmentMessageDto;
    return await this.attachmentsService.uploadMultipleFiles(files, message);
  }

  @Get('attachment-url')
  async getAttachmentUrl(@Query() query): Promise<AttachmentUrl> {
    return await this.attachmentsService.getAttachmentUrl(
      query.messageAttachmentId
    );
  }
}

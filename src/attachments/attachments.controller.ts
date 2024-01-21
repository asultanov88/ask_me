import {
  Body,
  Controller,
  Post,
  UploadedFile,
  UploadedFiles,
  UseInterceptors
} from '@nestjs/common';
import { FileInterceptor, FilesInterceptor } from '@nestjs/platform-express';
import { AttachmentsService } from './attachments.service';
import { AttachmentMessageDto } from './model/dto';

@Controller('attachments')
export class AttachmentsController {
  public constructor(private readonly attachmentsService: AttachmentsService) {}

  // This endpoint does not return any data. Instead, uploaded attachment is emitted via web socket.
  @Post('upload')
  @UseInterceptors(FilesInterceptor('files', 100))
  async uploadMultipleFiles(
    @UploadedFiles() files,
    @Body() body
  ): Promise<void> {
    // Message object is in string format.
    const message = JSON.parse(body.message) as AttachmentMessageDto;
    await this.attachmentsService.uploadMultipleFiles(files, message);
  }
}

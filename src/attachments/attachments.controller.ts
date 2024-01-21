import {
  Body,
  Controller,
  Post,
  UploadedFiles,
  UseInterceptors
} from '@nestjs/common';
import { FilesInterceptor } from '@nestjs/platform-express';
import { AttachmentsService } from './attachments.service';
import { AttachmentMessageDto } from './model/dto';

@Controller('attachments')
export class AttachmentsController {
  public constructor(private readonly attachmentsService: AttachmentsService) {}

  @Post('upload')
  @UseInterceptors(FilesInterceptor('files', 100))
  async uploadMultipleFiles(
    @UploadedFiles() files,
    @Body() body
  ): Promise<any> {
    const message = body.message as AttachmentMessageDto;
    console.log(message);
    return await this.attachmentsService.uploadFile(files);
  }
}

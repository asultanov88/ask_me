import {
  Controller,
  Post,
  UploadedFile,
  UploadedFiles,
  UseInterceptors
} from '@nestjs/common';
import { AttachmentsService } from './attachments.service';
import { FileInterceptor, FilesInterceptor } from '@nestjs/platform-express';

@Controller('attachments')
export class AttachmentsController {
  public constructor(private readonly attachmentsService: AttachmentsService) {}

  @Post('upload')
  @UseInterceptors(FilesInterceptor('files', 100))
  async uploadMultipleFiles(@UploadedFiles() files): Promise<any> {
    return await this.attachmentsService.uploadFile(files);
  }
}

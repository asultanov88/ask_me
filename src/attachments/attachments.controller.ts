import {
  Controller,
  Post,
  UploadedFile,
  UseInterceptors
} from '@nestjs/common';
import { AttachmentsService } from './attachments.service';
import { FileInterceptor } from '@nestjs/platform-express';

@Controller('attachments')
export class AttachmentsController {
  public constructor(private readonly attachmentsService: AttachmentsService) {}

  @Post('upload')
  @UseInterceptors(FileInterceptor('file'))
  uploadFile(@UploadedFile() file: Express.Multer.File[]) {
    return this.attachmentsService.uploadFile(file);
  }
}

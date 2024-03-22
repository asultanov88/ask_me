import { Body, Controller, Delete, Get, Post, Query } from '@nestjs/common';
import { AttachmentMessageDto } from 'src/attachments/model/dto';
import { PostedMessage } from 'src/gateway/dto';
import { MessagesService } from './messages.service';
import { SubjectDto } from './model/dto/dto';

@Controller('messages')
export class MessagesController {
  constructor(private readonly messageService: MessagesService) {}

  @Delete('message')
  async deleteMessageById(@Query() query): Promise<any> {
    return await this.messageService.deleteMessageById(
      parseInt(query.messageId, 10)
    );
  }

  @Post('attachment-message')
  async postAttachmentMessage(
    @Body() attachmentMessage: AttachmentMessageDto
  ): Promise<PostedMessage> {
    return await this.messageService.postAttachmentMessage(attachmentMessage);
  }

  @Get('subject-messages')
  async getSubjectMessages(@Query() query): Promise<any> {
    return await this.messageService.getSubjectMessages(
      query.subjectId,
      query.chunkCount,
      query.chunkNum
    );
  }

  @Post('subject')
  async postNewSubject(@Body() subject: SubjectDto): Promise<any> {
    return await this.messageService.postNewSubject(subject);
  }

  @Get('client-provider-subjects')
  async getClientProviderSubjects(@Query() query): Promise<any> {
    return await this.messageService.getClientProviderSubjects(
      query.providerId
    );
  }

  @Get('provider-client-subjects')
  async getProviderClientSubjects(@Query() query): Promise<any> {
    return await this.messageService.getProviderClientSubjects(query.clientId);
  }
}

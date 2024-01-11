import { Body, Controller, Get, Post, Query } from '@nestjs/common';
import { MessagesService } from './messages.service';
import { NewMessage, SubjectDto } from './model/dto/dto';

@Controller('messages')
export class MessagesController {
  constructor(private readonly messageService: MessagesService) {}

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

  @Post('message')
  async postNewMessage(@Body() newMessage: NewMessage): Promise<number> {
    return await this.messageService.postNewMessage(newMessage);
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

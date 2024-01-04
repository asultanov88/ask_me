import { Body, Controller, Get, Post, Query } from '@nestjs/common';
import { MessagesService } from './messages.service';
import { NewMessage, SubjectDto } from './model/dto/dto';

@Controller('messages')
export class MessagesController {
  constructor(private readonly messageService: MessagesService) {}

  @Post('subject')
  async postNewSubject(@Body() subject: SubjectDto): Promise<any> {
    return await this.messageService.postNewSubject(subject);
  }

  @Post('message')
  async postNewMessage(@Body() newMessage: NewMessage): Promise<number> {
    return await this.messageService.postNewMessage(newMessage);
  }

  @Get('clinet-provider-subjects')
  async getClientProviderSubjects(@Query() query): Promise<any> {
    return await this.messageService.getClientProviderSubjects(
      query.providerId
    );
  }
}

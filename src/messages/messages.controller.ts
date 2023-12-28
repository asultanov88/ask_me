import { Body, Controller, Post } from '@nestjs/common';
import { MessagesService } from './messages.service';
import { SubjectDto } from './model/dto/dto';

@Controller('messages')
export class MessagesController {
  constructor(private readonly messageService: MessagesService) {}

  @Post('subject')
  async postNewSubject(@Body() subject: SubjectDto): Promise<any> {
    return await this.messageService.postNewSubject(subject);
  }
}

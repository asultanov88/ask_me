import { Controller, Get } from '@nestjs/common';
import { ProvidersService } from './providers.service';
import { LkWeekDay } from './models/result';

@Controller('providers')
export class ProvidersController {
  constructor(private readonly providersService: ProvidersService) {}

  @Get('lk-week-days')
  async getWeekDays(): Promise<LkWeekDay[]> {
    return await this.providersService.getWeekDays();
  }
}

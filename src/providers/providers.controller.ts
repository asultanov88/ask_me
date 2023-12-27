import { Body, Controller, Get, Post } from '@nestjs/common';
import { ProvidersService } from './providers.service';
import {
  LkProviderCategory,
  LkWeekDay,
  LkWorkHour,
  ProviderDetails
} from './models/result';
import { BooleanResult } from 'src/database/table-types/shared-result';

@Controller('providers')
export class ProvidersController {
  constructor(private readonly providersService: ProvidersService) {}

  @Post('details')
  async postProviderDetails(
    @Body() providerDetails: ProviderDetails
  ): Promise<BooleanResult> {
    return await this.providersService.postProviderDetails(providerDetails);
  }

  @Get('lk-week-days')
  async getWeekDays(): Promise<LkWeekDay[]> {
    return await this.providersService.getWeekDays();
  }

  @Get('lk-work-hours')
  async getWorkHours(): Promise<LkWorkHour[]> {
    return await this.providersService.getWorkHours();
  }

  @Get('lk-category')
  async getCategories(): Promise<LkProviderCategory[]> {
    return await this.providersService.getCategories();
  }
}

import { Body, Controller, Get, Post } from '@nestjs/common';
import { ProvidersService } from './providers.service';
import {
  LkProviderCategory,
  LkWeekDay,
  LkWorkHour,
  ProviderDetails,
  ProviderDetailsResult,
  ProviderSearch,
  SelectProvider
} from './models/result';
import { BooleanResult } from 'src/database/table-types/shared-result';

@Controller('providers')
export class ProvidersController {
  constructor(private readonly providersService: ProvidersService) {}

  @Post('select-provider')
  async postSelectProvider(
    @Body() selectProvider: SelectProvider
  ): Promise<any> {
    return await this.providersService.postSelectProvider(
      selectProvider.providerId
    );
  }

  @Get('provider-search')
  async getProviderSearch(@Body() searchParams: ProviderSearch): Promise<any> {
    return await this.providersService.getProviderSearch(searchParams);
  }

  @Get('details')
  async getProviderDetails(): Promise<ProviderDetailsResult | any> {
    return await this.providersService.getProviderDetails(null);
  }

  @Get('details-by-provider-id')
  async getProviderDetailsById(
    @Body() providerSearch: SelectProvider
  ): Promise<ProviderDetailsResult | any> {
    return await this.providersService.getProviderDetails(providerSearch);
  }

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

import { Body, Controller, Get, Post, Query } from '@nestjs/common';
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

  @Get('my-providers')
  async getMyProviders(): Promise<any> {
    return await this.providersService.getMyProviders();
  }

  @Post('select-provider')
  async postSelectProvider(
    @Body() selectProvider: SelectProvider
  ): Promise<any> {
    return await this.providersService.postSelectProvider(
      selectProvider.providerId
    );
  }

  @Get('provider-search')
  async getProviderSearch(@Query() query): Promise<any> {
    const providerSearch: ProviderSearch = {
      lkCategoryId: query.lkCategoryId,
      searchKeyword: query.searchKeyword
    };
    return await this.providersService.getProviderSearch(providerSearch);
  }

  @Get('details')
  async getProviderDetails(): Promise<ProviderDetailsResult | any> {
    return await this.providersService.getProviderDetails(null);
  }

  @Get('details-by-provider-id')
  async getProviderDetailsById(
    @Query() query
  ): Promise<ProviderDetailsResult | any> {
    return await this.providersService.getProviderDetails(query.providerId);
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

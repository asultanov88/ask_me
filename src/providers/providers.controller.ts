import { Controller, Get } from '@nestjs/common';
import { ProvidersService } from './providers.service';
import { ProviderDto } from './models/dto';

@Controller('providers')
export class ProvidersController {
  constructor(private readonly providersService: ProvidersService) {}
}

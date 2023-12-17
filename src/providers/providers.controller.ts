import { Controller, Get } from '@nestjs/common';
import { ProvidersService } from './providers.service';
import { ProviderDto } from './models/dto';

@Controller('providers')
export class ProvidersController {
  constructor(private readonly providersService: ProvidersService) {}

  @Get()
  async getProviders(): Promise<any> {
    const providers: ProviderDto[] = [
      {
        ProviderId: null,
        FirstName: "TestFirs'tName",
        LastName: 'TestLastName',
        CreatedAt: '2023-12-13 22:57:47.2959264'
      },
      {
        ProviderId: null,
        FirstName: '2-TestFirstName',
        LastName: '2-TestLastName',
        CreatedAt: '2023-12-13 22:57:47.2959264'
      }
    ];
    const providers2: ProviderDto[] = [
      {
        ProviderId: null,
        FirstName: "X-TestFirs'tName",
        LastName: 'X-TestLastName',
        CreatedAt: '2023-12-13 22:57:47.2959264'
      },
      {
        ProviderId: null,
        FirstName: 'X2-TestFirstName',
        LastName: 'X2-TestLastName',
        CreatedAt: '2023-12-13 22:57:47.2959264'
      }
    ];
    return await this.providersService.getProviders(
      providers,
      providers2,
      '155'
    );
  }
}

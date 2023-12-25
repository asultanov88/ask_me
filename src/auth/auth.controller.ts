import { Body, Controller, Post } from '@nestjs/common';
import { AuthService } from './auth.service';
import { UserLogin } from './models/dto';

@Controller('auth')
export class AuthController {
  constructor(private readonly authService: AuthService) {}

  @Post('login')
  async login(@Body() body: UserLogin): Promise<string> {
    return await this.authService.login(body);
  }
}

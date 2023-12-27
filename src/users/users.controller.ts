import { Body, Controller, Get, Post } from '@nestjs/common';
import { UsersService } from './users.service';
import { UserDto } from './models/dto';
import { UserResult } from './models/result';

@Controller('users')
export class UsersController {
  constructor(private readonly userService: UsersService) {}

  @Get('me')
  async getMyUserProfile(): Promise<UserResult> {
    return await this.userService.getMyUserProfile();
  }

  @Post('user')
  async postUser(@Body() user: UserDto): Promise<number> {
    return await this.userService.postUser(user);
  }
}

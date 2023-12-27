import { Body, Controller, Post } from '@nestjs/common';
import { UsersService } from './users.service';
import { UserDto } from './models/dto';
import { UserResult } from './models/result';

@Controller('users')
export class UsersController {
  constructor(private readonly userService: UsersService) {}

  @Post('me')
  async getMyUserProfile(): Promise<UserResult> {
    return null;
  }

  @Post('user')
  async postUser(@Body() user: UserDto): Promise<number> {
    return await this.userService.postUser(user);
  }
}

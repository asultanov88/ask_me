import { Body, Controller, Post } from '@nestjs/common';
import { UsersService } from './users.service';
import { UserDto } from './models/dto';

@Controller('users')
export class UsersController {
  constructor(private readonly userService: UsersService) {}

  @Post('user')
  async postUser(@Body() user: UserDto): Promise<number> {
    return await this.userService.postuser(user);
  }
}

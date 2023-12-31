import {
  CanActivate,
  ExecutionContext,
  Injectable,
  UnauthorizedException
} from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { Request } from 'express';
import { SocketMessageDto } from 'src/gateway/dto';
import { AuthorisedUser } from './models/dto';

@Injectable()
export class AuthGuard implements CanActivate {
  constructor(private jwtService: JwtService) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const message = context.switchToWs().getData() as SocketMessageDto;
    const client = context.switchToWs().getClient();
    const accessToken = message.accessToken;
    if (!accessToken) {
      throw new UnauthorizedException();
    }
    try {
      const payload = (await this.jwtService.verifyAsync(accessToken, {
        secret: process.env.JWT_KEY
      })) as AuthorisedUser;
      payload.socketClientId = client.id;
      message['user'] = payload;
    } catch {
      throw new UnauthorizedException();
    }
    return true;
  }
}

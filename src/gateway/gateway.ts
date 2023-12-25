import { OnModuleInit, UseGuards } from '@nestjs/common';
import {
  MessageBody,
  SubscribeMessage,
  WebSocketGateway,
  WebSocketServer
} from '@nestjs/websockets';
import { Server } from 'socket.io';
import { AuthGuard } from 'src/auth/auth.guard';
import { SocketMessageDto } from './dto';

@WebSocketGateway()
export class Gateway implements OnModuleInit {
  @WebSocketServer()
  server: Server;

  onModuleInit() {
    this.server.on('connection', (socket) => {
      console.log(socket.id);
      console.log('connected');
    });
  }

  @UseGuards(AuthGuard)
  @SubscribeMessage('incomingMessage')
  onIncomingMessage(@MessageBody() body: SocketMessageDto) {
    this.server.emit('outgoingMessage', body.message);
  }
}

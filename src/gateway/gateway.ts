import { OnModuleInit, UseGuards } from '@nestjs/common';
import {
  MessageBody,
  SubscribeMessage,
  WebSocketGateway,
  WebSocketServer
} from '@nestjs/websockets';
import { Server } from 'socket.io';
import { AuthGuard } from 'src/auth/auth.guard';
import { SocketMessageDto, ViewedMessage } from './dto';
import { GatewayService } from './gateway.service';
import { Socket } from 'socket.io';

@WebSocketGateway()
export class Gateway implements OnModuleInit {
  constructor(private readonly gatewayService: GatewayService) {}
  @WebSocketServer()
  server: Server;

  onModuleInit() {
    this.server.on('connection', (socket) => {
      this.gatewayService.connectedClients.set(socket.id, socket);
    });
  }

  @UseGuards(AuthGuard)
  @SubscribeMessage('initiateSession')
  onInitiateSession(@MessageBody() body: SocketMessageDto) {
    this.gatewayService.userSocketClinet.set(
      body.user.userId,
      body.user.socketClientId
    );
  }

  @UseGuards(AuthGuard)
  @SubscribeMessage('viewedMessage')
  async onViewedMessage(@MessageBody() body: ViewedMessage) {
    this.gatewayService.updateMessageAsViewed(body);
  }

  @UseGuards(AuthGuard)
  @SubscribeMessage('incomingMessage')
  async onIncomingMessage(@MessageBody() body: SocketMessageDto) {
    const postedMessage = await this.gatewayService.postNewMessage(body);

    const receiverUserId: number = parseInt(body.toUserId?.toString(), 10);
    const receiverSocketId: string =
      this.gatewayService.userSocketClinet.get(receiverUserId);
    const receiverSocket: Socket =
      this.gatewayService.connectedClients.get(receiverSocketId);

    if (receiverSocket) {
      receiverSocket.emit('outgoingMessage', postedMessage);
    }
  }

  @UseGuards(AuthGuard)
  @SubscribeMessage('disconnect')
  onDisconnect(@MessageBody() body: SocketMessageDto) {
    // Removes client from active session list.
    this.gatewayService.connectedClients.delete(body.user.socketClientId);
    this.gatewayService.userSocketClinet.delete(body.user.userId);
  }
}

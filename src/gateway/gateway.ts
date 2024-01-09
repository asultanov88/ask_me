import { OnModuleInit, UseGuards } from '@nestjs/common';
import {
  MessageBody,
  OnGatewayDisconnect,
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
export class Gateway implements OnModuleInit, OnGatewayDisconnect {
  constructor(private readonly gatewayService: GatewayService) {}

  handleDisconnect(client: any) {
    // Delete client's socket instance.
    this.gatewayService.connectedClients.delete(client.id);

    // Delete client user id and socket id map entry.
    let disconnectUserId: number = null;
    for (let [key, value] of this.gatewayService.userSocketClinet.entries()) {
      if (value === client.id) {
        disconnectUserId = key;
        break;
      }
    }
    if (disconnectUserId) {
      this.gatewayService.userSocketClinet.delete(disconnectUserId);
    }
  }

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
  @SubscribeMessage('outgoingMessage')
  async onOutgoingMessage(@MessageBody() body: SocketMessageDto) {
    const postedMessage = await this.gatewayService.postNewMessage(body);

    // Emit message to the receiver.
    const receiverUserId: number = parseInt(body.toUserId?.toString(), 10);
    const receiverSocketId: string =
      this.gatewayService.userSocketClinet.get(receiverUserId);
    const receiverSocket: Socket =
      this.gatewayService.connectedClients.get(receiverSocketId);

    if (receiverSocket) {
      receiverSocket.emit('incomingMessage', postedMessage);
    }

    // Emit message back to the sender.
    const senderUserId: number = body.user.userId;
    const senderSocketId: string =
      this.gatewayService.userSocketClinet.get(senderUserId);
    const senderSocket: Socket =
      this.gatewayService.connectedClients.get(senderSocketId);

    if (senderSocket) {
      senderSocket.emit('incomingMessage', postedMessage);
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

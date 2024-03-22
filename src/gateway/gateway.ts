import {
  OnModuleInit,
  UploadedFiles,
  UseGuards,
  UseInterceptors
} from '@nestjs/common';
import {
  MessageBody,
  OnGatewayDisconnect,
  SubscribeMessage,
  WebSocketGateway,
  WebSocketServer
} from '@nestjs/websockets';
import { Server } from 'socket.io';
import { AuthGuard } from 'src/auth/auth.guard';
import {
  OutgoingAttachmentMessageDto,
  SocketMessageDto,
  UpdateMessageDto,
  UpdatedMessage,
  ViewedMessage
} from './dto';
import { GatewayService } from './gateway.service';
import { Socket } from 'socket.io';
import { MessageViewed } from 'src/messages/model/result/result';
import { FilesInterceptor } from '@nestjs/platform-express';

@WebSocketGateway({
  cors: {
    origin: '*',
    methods: ['GET', 'POST'],
    transports: ['websocket', 'polling'],
    credentials: false
  },
  allowEIO3: true
})
export class Gateway implements OnModuleInit, OnGatewayDisconnect {
  constructor(private readonly gatewayService: GatewayService) {}
  @WebSocketServer()
  server: Server;

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

  onModuleInit() {
    this.server.on('connection', (socket) => {
      this.gatewayService.connectedClients.set(socket.id, socket);
    });
  }

  @UseGuards(AuthGuard)
  @SubscribeMessage('initiateSession')
  onInitiateSession(@MessageBody() body: SocketMessageDto) {
    this.gatewayService.userSocketClinet.delete(body.user.userId);
    this.gatewayService.userSocketClinet.set(
      body.user.userId,
      body.user.socketClientId
    );
  }

  @UseGuards(AuthGuard)
  @SubscribeMessage('viewedMessage')
  async onViewedMessage(@MessageBody() body: ViewedMessage) {
    const messageViewed: MessageViewed =
      await this.gatewayService.updateMessageAsViewed(body);

    const clientSocket: Socket = this.gatewayService.getSocketByUserId(
      messageViewed.clientUserId
    );

    if (clientSocket) {
      clientSocket.emit('viewConfirmation', {
        messageId: messageViewed.messageId
      });
    }

    const providerSocket: Socket = this.gatewayService.getSocketByUserId(
      messageViewed.providerUserId
    );

    if (providerSocket) {
      providerSocket.emit('viewConfirmation', {
        messageId: messageViewed.messageId
      });
    }
  }

  @UseGuards(AuthGuard)
  @SubscribeMessage('updateMessage')
  async onUpdateMessage(@MessageBody() body: UpdateMessageDto) {
    let updatedMessage: UpdatedMessage =
      await this.gatewayService.updateMessage(body);
    // Emit message to the receiver.
    this.gatewayService.emitMessageToBothParties(
      updatedMessage.clientUserId,
      updatedMessage.providerUserId,
      updatedMessage.postedMessage
    );
  }
  @UseGuards(AuthGuard)
  @SubscribeMessage('outgoingMessage')
  async onOutgoingMessage(@MessageBody() body: SocketMessageDto) {
    if (!body.isAttachment) {
      let postedMessage = await this.gatewayService.postNewMessage(body);
      // Emit message to the receiver.
      this.gatewayService.emitMessageToReceiver(body.toUserId, postedMessage);
      // Emit message back to the sender.
      this.gatewayService.emitMessageToSender(body.user.userId, postedMessage);
    }
  }

  @UseGuards(AuthGuard)
  @SubscribeMessage('outgoingAttachment')
  async onOutgoingAttachment(
    @MessageBody() body: OutgoingAttachmentMessageDto
  ) {
    if (body.message.isAttachment) {
      let postedMessage = body.message;
      // Emit message to the receiver.
      this.gatewayService.emitMessageToReceiver(body.toUserId, postedMessage);
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

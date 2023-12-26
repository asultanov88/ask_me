import { Injectable } from '@nestjs/common';
import { Socket } from 'socket.io';

@Injectable()
export class GatewayService {
  // Maps socketId with socket instances.
  public readonly connectedClients: Map<string, Socket> = new Map();

  // Maps userId with socketId.
  public readonly userSocketClinet: Map<number, string> = new Map();
}

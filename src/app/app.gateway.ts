import {
  SubscribeMessage,
  WebSocketGateway,
  OnGatewayInit,
  WebSocketServer,
  OnGatewayConnection,
  OnGatewayDisconnect,
} from '@nestjs/websockets';
import { Logger } from '@nestjs/common';
import { Socket, Server } from 'socket.io';

@WebSocketGateway({
  cors: {
    origin: '*',
  },
})
export class AppGateway implements OnGatewayInit, OnGatewayConnection, OnGatewayDisconnect {
  @WebSocketServer()
  server: Server;

  private logger: Logger = new Logger('AppGateway');
  private userSockets: Map<string, Socket> = new Map<string, Socket>();

  @SubscribeMessage('joinChat')
  handleJoinChat(client: Socket, userId: string): void {
    this.userSockets.set(userId, client);
    this.logger.log(`User ${userId} joined the chat`);
  }

  @SubscribeMessage('leaveChat')
  handleLeaveChat(client: Socket, userId: string): void {
    this.userSockets.delete(userId);
    this.logger.log(`User ${userId} left the chat`);
  }

  @SubscribeMessage('privateMessage')
  handlePrivateMessage(client: Socket, payload: { to: string, message: string }): void {
    const { to, message } = payload;
    const senderId = this.getUserIdFromClient(client);

    if (this.userSockets.has(to)) {
      const receiverSocket = this.userSockets.get(to);
      receiverSocket.emit('privateMessage', { from: senderId, message });
    }
  }

  afterInit(server: Server) {
    this.logger.log('Init');
  }

  handleDisconnect(client: Socket) {
    const userId = this.getUserIdFromClient(client);
    this.userSockets.delete(userId);
    this.logger.log(`Client disconnected: ${userId}`);
  }

  handleConnection(client: Socket, ...args: any[]) {
    const userId = this.getUserIdFromClient(client);
    this.userSockets.set(userId, client);
    this.logger.log(`Client connected: ${userId}`);
  }

  private getUserIdFromClient(client: Socket): string {
    // Implement the logic to retrieve the user ID from the client
    // This can be based on authentication or any other means of identifying users
    // For this example, we assume the user ID is stored in the 'userId' property of the client's handshake data
    return client.handshake.auth.userId;
  }
}
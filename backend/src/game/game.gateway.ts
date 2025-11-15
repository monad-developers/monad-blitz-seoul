import {
  WebSocketGateway,
  WebSocketServer,
  OnGatewayInit,
  OnGatewayConnection,
  OnGatewayDisconnect,
} from '@nestjs/websockets';
import { Logger } from '@nestjs/common';
import { Server, Socket } from 'socket.io';

@WebSocketGateway({
  cors: {
    origin: '*', // POC용 - 프로덕션에서는 특정 도메인만 허용
  },
})
export class GameGateway
  implements OnGatewayInit, OnGatewayConnection, OnGatewayDisconnect
{
  @WebSocketServer()
  server: Server;

  private readonly logger = new Logger(GameGateway.name);

  afterInit(server: Server) {
    this.logger.log('✅ WebSocket Gateway initialized');
  }

  handleConnection(client: Socket) {
    this.logger.log(`🔌 Client connected: ${client.id}`);
  }

  handleDisconnect(client: Socket) {
    this.logger.log(`🔌 Client disconnected: ${client.id}`);
  }

  /**
   * 라운드 시작 알림
   */
  broadcastRoundStart(data: any) {
    this.server.emit('round-start', data);
    this.logger.debug(
      `📢 Round Start: ${data.chainType} #${data.roundNumber}`,
    );
  }

  /**
   * 라운드 종료 알림
   */
  broadcastRoundEnd(data: any) {
    this.server.emit('round-end', data);
    this.logger.debug(`📢 Round End: ${data.chainType} #${data.roundNumber}`);
  }

  /**
   * 실시간 가격 업데이트
   */
  broadcastPriceUpdate(data: any) {
    this.server.emit('price-update', data);
  }

  /**
   * 플레이어 상태 업데이트
   */
  broadcastPlayerUpdate(data: any) {
    this.server.emit('player-update', data);
    this.logger.debug(`📢 Player Update: ${data.chainType}`);
  }

  /**
   * 게임 종료 알림
   */
  broadcastGameEnd(data: any) {
    this.server.emit('game-end', data);
    this.logger.log(`🎉 Game Ended: ${data.chainType}`);
  }
}

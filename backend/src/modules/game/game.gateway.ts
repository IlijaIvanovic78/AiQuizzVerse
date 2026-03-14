import {
  WebSocketGateway,
  WebSocketServer,
  SubscribeMessage,
  MessageBody,
  ConnectedSocket,
  OnGatewayConnection,
  OnGatewayDisconnect,
} from '@nestjs/websockets';
import { Server, Socket } from 'socket.io';
import { Logger } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { ConfigService } from '@nestjs/config';
import { BoostType } from '@prisma/client';
import { GameService } from './game.service';
import { GameRoomService } from './game-room.service';
import { GameStateService } from './game-state.service';

@WebSocketGateway({
  namespace: '/game',
  cors: {
    origin: process.env.FRONTEND_URL || 'http://localhost:4200',
    credentials: true,
  },
})
export class GameGateway implements OnGatewayConnection, OnGatewayDisconnect {
  @WebSocketServer()
  server: Server;

  private logger = new Logger('GameGateway');

  constructor(
    private readonly jwtService: JwtService,
    private readonly configService: ConfigService,
    private readonly gameService: GameService,
    private readonly roomService: GameRoomService,
    private readonly stateService: GameStateService,
  ) {}

  async handleConnection(client: Socket) {
    try {
      const token =
        client.handshake.auth?.token ||
        client.handshake.query?.token;

      if (!token) {
        client.disconnect();
        return;
      }

      const payload = await this.jwtService.verifyAsync(token as string, {
        secret: this.configService.get<string>('JWT_ACCESS_SECRET'),
      });

      const userId = payload.sub || payload.userId;
      client.data.userId = userId;
      this.roomService.registerSocket(client.id, userId);
      this.logger.log(`Game client connected: ${client.id} (User: ${userId})`);
    } catch {
      client.disconnect();
    }
  }

  handleDisconnect(client: Socket) {
    const userId = this.roomService.handleDisconnect(client.id, this.server);
    if (userId) {
      this.logger.log(`Game client disconnected: ${client.id} (User: ${userId})`);
    }
  }

  // ─── Room Management ──────────────────────────────────────

  @SubscribeMessage('join-room')
  async handleJoinRoom(
    @ConnectedSocket() client: Socket,
    @MessageBody() data: { matchId: string },
  ) {
    const userId = client.data.userId;
    if (!userId) return;

    const { matchId } = data;
    await client.join(`match:${matchId}`);
    this.roomService.joinRoom(matchId, client.id);

    const match = await this.gameService.getMatch(matchId);
    this.server.to(`match:${matchId}`).emit('player-joined', {
      userId,
      players: match.players,
    });
    this.logger.log(`User ${userId} joined room match:${matchId}`);
  }

  @SubscribeMessage('leave-room')
  async handleLeaveRoom(
    @ConnectedSocket() client: Socket,
    @MessageBody() data: { matchId: string },
  ) {
    const { matchId } = data;
    await client.leave(`match:${matchId}`);
    this.roomService.leaveRoom(matchId, client.id);
    this.server.to(`match:${matchId}`).emit('player-left', { userId: client.data.userId });
  }

  // ─── Start Match ──────────────────────────────────────────

  @SubscribeMessage('start-match')
  async handleStartMatch(
    @ConnectedSocket() client: Socket,
    @MessageBody() data: { matchId: string },
  ) {
    const { matchId } = data;
    const match = await this.gameService.getMatch(matchId);

    this.stateService.initQuestionIndex(matchId);

    const firstQuestion = match.quiz.id
      ? await this.stateService.getQuestionForMatch(matchId, 0)
      : null;

    if (!firstQuestion) return;

    if (match.type === 'COOP') {
      const firstPlayerId = match.players[0]?.userId;
      if (firstPlayerId) this.stateService.setCoopTurn(matchId, firstPlayerId);
    }

    this.server.to(`match:${matchId}`).emit('match-started', {
      matchId,
      question: firstQuestion,
      questionIndex: 0,
      totalQuestions: match.quiz.numQuestions,
      timePerQuestion: match.quiz.timePerQuestion,
      currentTurn: this.stateService.getCoopTurn(matchId) || null,
    });
  }

  // ─── Submit Answer ────────────────────────────────────────

  @SubscribeMessage('submit-answer')
  async handleSubmitAnswer(
    @ConnectedSocket() client: Socket,
    @MessageBody()
    data: { matchId: string; questionId: string; answer: number; timeMs: number },
  ) {
    const userId = client.data.userId;
    if (!userId) return;

    const { matchId, questionId, answer, timeMs } = data;
    const match = await this.gameService.getMatch(matchId);

    // ─── SOLO ────────────────────────────────────────────────
    if (match.type === 'SOLO') {
      const result = await this.gameService.submitAnswer(matchId, userId, questionId, answer, timeMs);
      client.emit('answer-result', { ...result, userId });
      await this.stateService.advanceOrFinish(this.server, matchId, match.type, match.quiz.numQuestions);
      return;
    }

    // ─── COOP (turn-based) ───────────────────────────────────
    if (match.type === 'COOP') {
      const currentTurn = this.stateService.getCoopTurn(matchId);
      if (currentTurn !== userId) {
        client.emit('error', { message: 'Not your turn' });
        return;
      }
      const result = await this.gameService.submitAnswer(matchId, userId, questionId, answer, timeMs);
      const coopPlayer = match.players.find((p) => p.userId === userId);
      this.server.to(`match:${matchId}`).emit('answer-result', {
        ...result, userId,
        username: coopPlayer?.user?.username || 'Unknown',
      });

      // Switch turn
      const otherPlayer = match.players.find((p) => p.userId !== userId);
      if (otherPlayer) {
        this.stateService.setCoopTurn(matchId, otherPlayer.userId);
      }
      await this.stateService.advanceOrFinish(this.server, matchId, match.type, match.quiz.numQuestions);
      return;
    }

    // ─── PvP (zip both answers) ─────────────────────────────
    const pending = this.stateService.getPendingAnswers(matchId);

    // Prevent duplicate submission for same question
    if (pending.some((p) => p.userId === userId)) return;

    pending.push({ userId, questionId, answer, timeMs });

    // Wait for both players
    if (pending.length < 2) {
      client.emit('answer-received', { questionId });
      return;
    }

    // Both answered — process
    const results: Record<string, unknown>[] = [];
    for (const pa of pending) {
      const result = await this.gameService.submitAnswer(
        matchId,
        pa.userId,
        pa.questionId,
        pa.answer,
        pa.timeMs,
      );
      const pvpPlayer = match.players.find((p) => p.userId === pa.userId);
      results.push({
        ...result,
        userId: pa.userId,
        username: pvpPlayer?.user?.username || 'Unknown',
      });
    }
    this.stateService.clearPendingAnswers(matchId);

    // Broadcast results to both
    this.server.to(`match:${matchId}`).emit('round-results', { results });
    await this.stateService.advanceOrFinish(this.server, matchId, match.type, match.quiz.numQuestions);
  }

  // ─── Use Boost ────────────────────────────────────────────

  @SubscribeMessage('use-boost')
  async handleUseBoost(
    @ConnectedSocket() client: Socket,
    @MessageBody() data: { matchId: string; boostType: string; questionId?: string },
  ) {
    const userId = client.data.userId;
    if (!userId) return;

    try {
      const boostType = data.boostType as BoostType;
      const result = await this.gameService.useBoost(
        userId,
        boostType,
        data.matchId,
        data.questionId,
      );
      client.emit('boost-applied', result);
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : 'Boost failed';
      client.emit('boost-error', { message });
    }
  }
}

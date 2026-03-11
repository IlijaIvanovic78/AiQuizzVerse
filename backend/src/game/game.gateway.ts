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
import { GameService } from './game.service';
import { UsersService } from '../users/users.service';

interface PendingAnswer {
  userId: string;
  questionId: string;
  answer: number;
  timeMs: number;
}

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
  /** socketId → userId */
  private socketUsers = new Map<string, string>();
  /** matchId → set of socketIds */
  private matchRooms = new Map<string, Set<string>>();
  /** matchId → current question index */
  private matchQuestionIndex = new Map<string, number>();
  /** matchId → pending answers for current question (PvP zip) */
  private pendingAnswers = new Map<string, PendingAnswer[]>();
  /** matchId → co-op current turn userId */
  private coopTurn = new Map<string, string>();

  constructor(
    private jwtService: JwtService,
    private configService: ConfigService,
    private gameService: GameService,
    private usersService: UsersService,
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
      this.socketUsers.set(client.id, userId);
      this.logger.log(`Game client connected: ${client.id} (User: ${userId})`);
    } catch {
      client.disconnect();
    }
  }

  handleDisconnect(client: Socket) {
    const userId = this.socketUsers.get(client.id);
    this.socketUsers.delete(client.id);
    if (userId) {
      this.logger.log(`Game client disconnected: ${client.id} (User: ${userId})`);
    }
    // Clean up room references
    for (const [matchId, sockets] of this.matchRooms.entries()) {
      if (sockets.has(client.id)) {
        sockets.delete(client.id);
        // Notify remaining players
        this.server.to(`match:${matchId}`).emit('player-disconnected', { userId });
      }
    }
  }

  // ─── Room Management ──────────────────────────────────────

  @SubscribeMessage('join-room')
  async handleJoinRoom(
    @ConnectedSocket() client: Socket,
    @MessageBody() data: { matchId: string },
  ) {
    const { matchId } = data;
    const userId = client.data.userId;
    if (!userId) return;

    await client.join(`match:${matchId}`);

    if (!this.matchRooms.has(matchId)) {
      this.matchRooms.set(matchId, new Set());
    }
    this.matchRooms.get(matchId)!.add(client.id);

    // Fetch updated match with all players and broadcast
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
    this.matchRooms.get(matchId)?.delete(client.id);
    this.server.to(`match:${matchId}`).emit('player-left', { userId: client.data.userId });
  }

  // ─── Start Match ──────────────────────────────────────────

  @SubscribeMessage('start-match')
  async handleStartMatch(
    @ConnectedSocket() client: Socket,
    @MessageBody() data: { matchId: string },
  ) {
    const matchId = data.matchId;
    const match = await this.gameService.getMatch(matchId);

    this.matchQuestionIndex.set(matchId, 0);

    const firstQuestion = match.quiz.id
      ? await this.getQuestionForMatch(matchId, 0)
      : null;

    if (!firstQuestion) return;

    if (match.type === 'COOP') {
      // Set first player as initial turn
      const firstPlayerId = match.players[0]?.userId;
      if (firstPlayerId) this.coopTurn.set(matchId, firstPlayerId);
    }

    this.server.to(`match:${matchId}`).emit('match-started', {
      matchId,
      question: firstQuestion,
      questionIndex: 0,
      totalQuestions: match.quiz.numQuestions,
      timePerQuestion: match.quiz.timePerQuestion,
      currentTurn: this.coopTurn.get(matchId) || null,
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
      await this.advanceOrFinish(matchId, match.type, match.quiz.numQuestions);
      return;
    }

    // ─── COOP (turn-based) ───────────────────────────────────
    if (match.type === 'COOP') {
      const currentTurn = this.coopTurn.get(matchId);
      if (currentTurn !== userId) {
        client.emit('error', { message: 'Not your turn' });
        return;
      }
      // In co-op both share score — attribute to submitting player
      const result = await this.gameService.submitAnswer(matchId, userId, questionId, answer, timeMs);
      const coopPlayer = match.players.find((p) => p.userId === userId);
      this.server.to(`match:${matchId}`).emit('answer-result', {
        ...result, userId,
        username: coopPlayer?.user?.username || 'Unknown',
      });

      // Switch turn
      const otherPlayer = match.players.find((p) => p.userId !== userId);
      if (otherPlayer) {
        this.coopTurn.set(matchId, otherPlayer.userId);
      }
      await this.advanceOrFinish(matchId, match.type, match.quiz.numQuestions);
      return;
    }

    // ─── PvP (zip both answers) ─────────────────────────────
    if (!this.pendingAnswers.has(matchId)) {
      this.pendingAnswers.set(matchId, []);
    }
    const pending = this.pendingAnswers.get(matchId)!;

    // Prevent duplicate submission for same question
    if (pending.some((p) => p.userId === userId)) return;

    pending.push({ userId, questionId, answer, timeMs });

    // Wait for both players
    if (pending.length < 2) {
      // Acknowledge receipt
      client.emit('answer-received', { questionId });
      return;
    }

    // Both answered — process
    const results: any[] = [];
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
    this.pendingAnswers.set(matchId, []);

    // Broadcast results to both
    this.server.to(`match:${matchId}`).emit('round-results', { results });
    await this.advanceOrFinish(matchId, match.type, match.quiz.numQuestions);
  }

  // ─── Helpers ──────────────────────────────────────────────

  private async advanceOrFinish(matchId: string, type: string, totalQuestions: number) {
    const idx = (this.matchQuestionIndex.get(matchId) ?? 0) + 1;
    this.matchQuestionIndex.set(matchId, idx);

    const RESULT_DISPLAY_MS = 3000;

    if (idx >= totalQuestions) {
      setTimeout(async () => {
        const finished = await this.gameService.finishMatch(matchId);
        await this.awardRewards(finished);
        this.server.to(`match:${matchId}`).emit('match-finished', finished);
        this.cleanupMatch(matchId);
      }, RESULT_DISPLAY_MS);
      return;
    }

    setTimeout(async () => {
      const nextQuestion = await this.getQuestionForMatch(matchId, idx);
      this.server.to(`match:${matchId}`).emit('next-question', {
        question: nextQuestion,
        questionIndex: idx,
        currentTurn: this.coopTurn.get(matchId) || null,
      });
    }, RESULT_DISPLAY_MS);
  }

  private async getQuestionForMatch(matchId: string, index: number) {
    const match = await this.gameService.getMatch(matchId);
    if (!this.questionsCache.has(matchId)) {
      const questions = await this.gameService.getQuizQuestions(match.quiz.id);
      this.questionsCache.set(matchId, questions);
    }
    const questions = this.questionsCache.get(matchId)!;
    const q = questions[index];
    if (!q) return null;
    // Don't send correctAnswer to clients
    return { id: q.id, text: q.text, options: q.options, index };
  }

  private questionsCache = new Map<string, any[]>();

  private async awardRewards(match: any) {
    if (!match.players) return;
    for (const player of match.players) {
      let xp = 0;
      let coins = 0;
      if (match.type === 'SOLO') {
        xp = 50;
        coins = 20;
      } else if (match.type === 'COOP') {
        xp = 75;
        coins = 40;
      } else if (match.type === 'PVP') {
        if (player.isWinner) {
          xp = 100;
          coins = 50;
        } else {
          xp = 25;
          coins = 10;
        }
      }
      if (xp > 0 || coins > 0) {
        await this.usersService.addRewards(player.userId, xp, coins);
      }
    }
  }

  private cleanupMatch(matchId: string) {
    this.matchQuestionIndex.delete(matchId);
    this.pendingAnswers.delete(matchId);
    this.coopTurn.delete(matchId);
    this.questionsCache.delete(matchId);
  }
}

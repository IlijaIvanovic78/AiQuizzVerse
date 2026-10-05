import { Logger, UseFilters, UsePipes, ValidationPipe } from '@nestjs/common';
import {
  ConnectedSocket,
  MessageBody,
  OnGatewayConnection,
  OnGatewayDisconnect,
  OnGatewayInit,
  SubscribeMessage,
  WebSocketGateway,
  WebSocketServer,
  WsException,
} from '@nestjs/websockets';
import { DEFAULT_FRONTEND_URL, userRoom } from '../realtime/realtime.constants';
import { WsAuthService } from '../realtime/ws-auth.service';
import { AnswerDto } from './dto/answer.dto';
import { MatchIdDto } from './dto/match-id.dto';
import { NextQuestionDto } from './dto/next-question.dto';
import { UseBoostDto } from './dto/use-boost.dto';
import { MatchWithPlayers } from './match.mapper';
import { MatchPlayService } from './match-play.service';
import { MatchResultsService } from './match-results.service';
import { MatchSession } from './match-session';
import { MatchSessionRegistry } from './match-session-registry.service';
import { GAME_NAMESPACE, MATCH_STARTED_MESSAGE, matchRoom, MAX_PLAYERS } from './matches.constants';
import { MatchesService } from './matches.service';
import type { GameServer, GameSocket, MatchView } from './matches.types';
import { WsExceptionFilter } from './ws-exception.filter';

@UsePipes(new ValidationPipe({ whitelist: true }))
@UseFilters(WsExceptionFilter)
@WebSocketGateway({
  namespace: GAME_NAMESPACE,
  cors: { origin: process.env.FRONTEND_URL ?? DEFAULT_FRONTEND_URL, credentials: true },
})
export class MatchGateway implements OnGatewayInit, OnGatewayConnection, OnGatewayDisconnect {
  @WebSocketServer()
  server: GameServer;

  private readonly logger = new Logger(MatchGateway.name);

  constructor(
    private readonly wsAuth: WsAuthService,
    private readonly matches: MatchesService,
    private readonly play: MatchPlayService,
    private readonly results: MatchResultsService,
    private readonly registry: MatchSessionRegistry,
  ) {}

  afterInit(server: GameServer): void {
    server.use((socket, next) => {
      this.wsAuth.authenticate(socket).then(
        () => next(),
        () => next(new Error('unauthorized')),
      );
    });
  }

  async handleConnection(socket: GameSocket): Promise<void> {
    await socket.join(userRoom(socket.data.userId));
  }

  async handleDisconnect(socket: GameSocket): Promise<void> {
    const { userId, matchId } = socket.data;
    if (!matchId) {
      return;
    }
    try {
      await this.handlePlayerGone(matchId, userId);
    } catch (error) {
      this.logger.error(
        `Could not handle a disconnect from match ${matchId}`,
        (error as Error).stack,
      );
    }
  }

  @SubscribeMessage('match:join')
  async join(
    @ConnectedSocket() socket: GameSocket,
    @MessageBody() { matchId }: MatchIdDto,
  ): Promise<void> {
    const { userId } = socket.data;
    const match = await this.matches.findForPlayer(matchId, userId);
    if (match.status === 'FINISHED') {
      socket.emit('match:finished', await this.results.findResult(matchId, userId));
      return;
    }
    if (match.status === 'ABANDONED') {
      throw new WsException('This match has ended.');
    }

    await this.enterRoom(socket, matchId);
    if (match.status === 'IN_PROGRESS') {
      await this.rejoin(matchId, userId);
      return;
    }
    await this.broadcastLobby(matchId);
    if (match.mode === 'SOLO') {
      await this.startMatch(match);
    }
  }

  @SubscribeMessage('match:leave')
  async leave(
    @ConnectedSocket() socket: GameSocket,
    @MessageBody() { matchId }: MatchIdDto,
  ): Promise<void> {
    const { userId } = socket.data;
    await this.leaveRoom(socket, matchId);
    const session = this.registry.get(matchId);
    if (session) {
      await session.quit(userId);
      return;
    }
    await this.leaveLobby(matchId, userId);
  }

  @SubscribeMessage('match:start')
  async start(
    @ConnectedSocket() socket: GameSocket,
    @MessageBody() { matchId }: MatchIdDto,
  ): Promise<void> {
    const match = await this.matches.findForPlayer(matchId, socket.data.userId);
    if (match.hostId !== socket.data.userId) {
      throw new WsException('Only the host can start the match.');
    }
    await this.startMatch(match);
  }

  @SubscribeMessage('match:answer')
  answer(@ConnectedSocket() socket: GameSocket, @MessageBody() dto: AnswerDto): void {
    const { userId } = socket.data;
    this.sessionFor(dto.matchId, userId).submitAnswer(userId, dto.questionIndex, dto.optionIndex);
  }

  @SubscribeMessage('match:next')
  next(@ConnectedSocket() socket: GameSocket, @MessageBody() dto: NextQuestionDto): void {
    const { userId } = socket.data;
    this.sessionFor(dto.matchId, userId).pressNext(userId, dto.questionIndex);
  }

  @SubscribeMessage('match:boost')
  async boost(
    @ConnectedSocket() socket: GameSocket,
    @MessageBody() dto: UseBoostDto,
  ): Promise<void> {
    const { userId } = socket.data;
    await this.sessionFor(dto.matchId, userId).useBoost(userId, dto.type);
  }

  private async startMatch(match: MatchWithPlayers): Promise<void> {
    if (match.status !== 'WAITING') {
      throw new WsException(MATCH_STARTED_MESSAGE);
    }
    if (match.mode !== 'SOLO' && !(await this.bothPlayersConnected(match))) {
      throw new WsException('Wait until both players are here.');
    }
    await this.registry.start(match.id, this.server);
  }

  private async bothPlayersConnected(match: MatchWithPlayers): Promise<boolean> {
    const connectedUserIds = await this.connectedUserIds(match.id);
    return (
      match.players.length === MAX_PLAYERS &&
      match.players.every((player) => connectedUserIds.includes(player.userId))
    );
  }

  private async rejoin(matchId: string, userId: string): Promise<void> {
    const session = this.registry.get(matchId);
    if (!session) {
      await this.play.abandon(matchId);
      throw new WsException('This match was interrupted');
    }
    session.playerReturned(userId);
  }

  private async leaveLobby(matchId: string, userId: string): Promise<void> {
    const match = await this.matches.findForPlayer(matchId, userId);
    if (match.status !== 'WAITING') {
      return;
    }
    if (match.hostId === userId) {
      await this.play.abandon(matchId);
    } else {
      await this.play.removeGuest(matchId, userId);
    }
    await this.broadcastLobby(matchId);
  }

  // A player is gone only when none of their sockets (tabs, reconnects) is left
  // in the match room.
  private async handlePlayerGone(matchId: string, userId: string): Promise<void> {
    const connectedUserIds = await this.connectedUserIds(matchId);
    if (connectedUserIds.includes(userId)) {
      return;
    }
    const session = this.registry.get(matchId);
    if (session) {
      session.playerDisconnected(userId);
      return;
    }
    const view = await this.play.findLobbyView(matchId, connectedUserIds);
    if (view.status === 'WAITING') {
      this.emitLobby(view);
    }
  }

  private async enterRoom(socket: GameSocket, matchId: string): Promise<void> {
    const previousMatchId = socket.data.matchId;
    await socket.join(matchRoom(matchId));
    socket.data.matchId = matchId;
    if (previousMatchId && previousMatchId !== matchId) {
      await socket.leave(matchRoom(previousMatchId));
      await this.handlePlayerGone(previousMatchId, socket.data.userId);
    }
  }

  private async leaveRoom(socket: GameSocket, matchId: string): Promise<void> {
    await socket.leave(matchRoom(matchId));
    if (socket.data.matchId === matchId) {
      socket.data.matchId = undefined;
    }
  }

  private sessionFor(matchId: string, userId: string): MatchSession {
    const session = this.registry.get(matchId);
    if (!session?.hasPlayer(userId)) {
      throw new WsException('This match is not running.');
    }
    return session;
  }

  private async broadcastLobby(matchId: string): Promise<void> {
    this.emitLobby(await this.play.findLobbyView(matchId, await this.connectedUserIds(matchId)));
  }

  private emitLobby(view: MatchView): void {
    this.server.to(matchRoom(view.id)).emit('match:lobby', view);
  }

  private async connectedUserIds(matchId: string): Promise<string[]> {
    const sockets = await this.server.in(matchRoom(matchId)).fetchSockets();
    return sockets.map((socket) => socket.data.userId);
  }
}

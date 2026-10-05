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
import { errorStack } from '../../common/utils/errors';
import { DEFAULT_FRONTEND_URL, userRoom } from '../realtime/realtime.constants';
import { WsAuthService } from '../realtime/ws-auth.service';
import { AnswerDto } from './dto/answer.dto';
import { MatchIdDto } from './dto/match-id.dto';
import { NextQuestionDto } from './dto/next-question.dto';
import { SabotageDto } from './dto/sabotage.dto';
import { UseBoostDto } from './dto/use-boost.dto';
import { MatchWithPlayers, NOBODY_CONNECTED, toMatchView } from './match.mapper';
import { MatchPlayService } from './match-play.service';
import { MatchResultsService } from './match-results.service';
import { MatchSession } from './match-session';
import { MatchSessionRegistry } from './match-session-registry.service';
import {
  GAME_NAMESPACE,
  MATCH_STARTED_MESSAGE,
  matchRoom,
  MIN_PLAYERS_TO_START,
} from './matches.constants';
import { MatchesService } from './matches.service';
import type { GameServer, GameSocket, MatchView } from './matches.types';
import { WsExceptionFilter } from './ws-exception.filter';

@UsePipes(new ValidationPipe({ whitelist: true }))
@UseFilters(WsExceptionFilter)
@WebSocketGateway({
  namespace: GAME_NAMESPACE,
  cors: { origin: process.env.FRONTEND_URL ?? DEFAULT_FRONTEND_URL },
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
    server.use(this.wsAuth.middleware);
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
      this.logger.error(`Could not handle a disconnect from match ${matchId}`, errorStack(error));
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
    // The view tells a client that reconnects after a restart that the match is over.
    if (match.status === 'ABANDONED') {
      socket.emit('match:lobby', toMatchView(match, NOBODY_CONNECTED));
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

  @SubscribeMessage('match:sabotage')
  sabotage(@ConnectedSocket() socket: GameSocket, @MessageBody() dto: SabotageDto): void {
    const { userId } = socket.data;
    this.sessionFor(dto.matchId, userId).sabotage(userId, dto.targetUserId, dto.type);
  }

  private async startMatch(match: MatchWithPlayers): Promise<void> {
    if (match.status !== 'WAITING') {
      throw new WsException(MATCH_STARTED_MESSAGE);
    }
    const connectedUserIds = await this.connectedUserIds(match.id);
    this.assertEnoughPlayers(match, connectedUserIds);
    await this.registry.start(match.id, this.server, connectedUserIds);
  }

  private assertEnoughPlayers(match: MatchWithPlayers, connectedUserIds: string[]): void {
    const connectedPlayers = match.players.filter((player) =>
      connectedUserIds.includes(player.userId),
    );
    const neededPlayers = MIN_PLAYERS_TO_START[match.mode];
    if (connectedPlayers.length >= neededPlayers) {
      return;
    }
    const message =
      match.mode === 'PARTY'
        ? `Wait until at least ${neededPlayers} players are here.`
        : 'Wait until both players are here.';
    throw new WsException(message);
  }

  /** The room gets the lobby view again, so the others see that the player is back. */
  private async rejoin(matchId: string, userId: string): Promise<void> {
    const session = this.registry.get(matchId);
    if (!session) {
      await this.play.abandon(matchId);
      await this.broadcastLobby(matchId);
      throw new WsException('This match was interrupted');
    }
    session.playerReturned(userId);
    await this.broadcastLobby(matchId);
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
    const view = await this.play.findLobbyView(matchId, connectedUserIds, []);
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
    const connectedUserIds = await this.connectedUserIds(matchId);
    const liveStats = this.registry.get(matchId)?.liveStats() ?? [];
    this.emitLobby(await this.play.findLobbyView(matchId, connectedUserIds, liveStats));
  }

  private emitLobby(view: MatchView): void {
    this.server.to(matchRoom(view.id)).emit('match:lobby', view);
  }

  private async connectedUserIds(matchId: string): Promise<string[]> {
    const sockets = await this.server.in(matchRoom(matchId)).fetchSockets();
    return sockets.map((socket) => socket.data.userId);
  }
}

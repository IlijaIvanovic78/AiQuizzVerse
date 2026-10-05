import { Injectable, OnModuleDestroy } from '@nestjs/common';
import { NotificationsService } from '../realtime/notifications.service';
import { MatchPlayService } from './match-play.service';
import { MatchResultsService } from './match-results.service';
import { MatchSession, MatchSessionDeps } from './match-session';
import { GameServer } from './matches.types';

@Injectable()
export class MatchSessionRegistry implements OnModuleDestroy {
  private readonly sessions = new Map<string, MatchSession>();

  constructor(
    private readonly play: MatchPlayService,
    private readonly results: MatchResultsService,
    private readonly notifications: NotificationsService,
  ) {}

  get(matchId: string): MatchSession | undefined {
    return this.sessions.get(matchId);
  }

  // The database claim decides who starts the match. It comes before loading the
  // players, because join and removeGuest only change a WAITING match, so the list
  // cannot change after the claim. has() and set() run without an await between them.
  async start(matchId: string, server: GameServer, connectedUserIds: string[]): Promise<void> {
    const claimed = await this.play.claimStart(matchId);
    if (!claimed) {
      return;
    }
    const { match, questions } = await this.play.loadSessionSetup(matchId);
    if (this.sessions.has(matchId)) {
      return;
    }
    const session = new MatchSession(this.sessionDeps(server), match, questions);
    this.sessions.set(matchId, session);
    session.start(connectedUserIds);
  }

  onModuleDestroy(): void {
    this.sessions.forEach((session) => session.stop());
  }

  private sessionDeps(server: GameServer): MatchSessionDeps {
    return {
      server,
      play: this.play,
      results: this.results,
      notifications: this.notifications,
      onClosed: (matchId) => this.sessions.delete(matchId),
    };
  }
}

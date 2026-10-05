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

  // The database claim decides who starts the match; has() and set() run
  // without an await between them.
  async start(matchId: string, server: GameServer): Promise<void> {
    const { match, questions } = await this.play.loadSessionSetup(matchId);
    const claimed = await this.play.claimStart(matchId);
    if (!claimed || this.sessions.has(matchId)) {
      return;
    }
    const session = new MatchSession(this.sessionDeps(server), match, questions);
    this.sessions.set(matchId, session);
    session.start();
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

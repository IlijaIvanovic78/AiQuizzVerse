import { Injectable, OnModuleDestroy } from '@nestjs/common';
import { NotificationsService } from '../realtime/notifications.service';
import { MatchPlayService } from './match-play.service';
import { MatchResultsService } from './match-results.service';
import { MatchSession, MatchSessionDeps } from './match-session';
import { GameServer, SessionSetup } from './matches.types';

@Injectable()
export class MatchSessionRegistry implements OnModuleDestroy {
  private readonly sessions = new Map<string, MatchSession>();
  /** Matches that start() is still working on, so they have no session yet. */
  private readonly starting = new Set<string>();

  constructor(
    private readonly play: MatchPlayService,
    private readonly results: MatchResultsService,
    private readonly notifications: NotificationsService,
  ) {}

  get(matchId: string): MatchSession | undefined {
    return this.sessions.get(matchId);
  }

  isStarting(matchId: string): boolean {
    return this.starting.has(matchId);
  }

  // Players can only join a WAITING match, so the player list is fixed once the claim succeeds.
  async start(matchId: string, server: GameServer, connectedUserIds: string[]): Promise<void> {
    if (this.starting.has(matchId)) {
      return;
    }
    this.starting.add(matchId);
    try {
      const claimed = await this.play.claimStart(matchId);
      if (!claimed) {
        return;
      }
      const { match, questions } = await this.loadClaimedMatch(matchId);
      const session = new MatchSession(this.sessionDeps(server), match, questions);
      this.sessions.set(matchId, session);
      session.start(connectedUserIds);
    } finally {
      this.starting.delete(matchId);
    }
  }

  onModuleDestroy(): void {
    this.sessions.forEach((session) => session.stop());
  }

  /** A claimed match that cannot be loaded is abandoned, so it does not stay IN_PROGRESS. */
  private async loadClaimedMatch(matchId: string): Promise<SessionSetup> {
    try {
      return await this.play.loadSessionSetup(matchId);
    } catch (error) {
      await this.play.abandon(matchId);
      throw error;
    }
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

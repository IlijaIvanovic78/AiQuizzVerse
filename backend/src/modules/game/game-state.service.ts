import { Injectable } from '@nestjs/common';
import { Server } from 'socket.io';
import { MatchType } from '@prisma/client';
import { GameService } from './game.service';
import { UsersService } from '../users/users.service';
import { MATCH_REWARDS, RESULT_DISPLAY_MS } from '../../core/constants/game.constants';

export interface PendingAnswer {
  userId: string;
  questionId: string;
  answer: number;
  timeMs: number;
}

interface CachedQuestion {
  id: string;
  text: string;
  options: unknown;
  index: number;
}

@Injectable()
export class GameStateService {
  /** matchId → current question index */
  private matchQuestionIndex = new Map<string, number>();
  /** matchId → pending answers for current question (PvP zip) */
  private pendingAnswers = new Map<string, PendingAnswer[]>();
  /** matchId → co-op current turn userId */
  private coopTurn = new Map<string, string>();
  /** matchId → cached questions (sent without correctAnswer) */
  private questionsCache = new Map<string, CachedQuestion[]>();

  constructor(
    private readonly gameService: GameService,
    private readonly usersService: UsersService,
  ) {}

  // ─── Question Index ───────────────────────────────────────

  initQuestionIndex(matchId: string): void {
    this.matchQuestionIndex.set(matchId, 0);
  }

  getQuestionIndex(matchId: string): number {
    return this.matchQuestionIndex.get(matchId) ?? 0;
  }

  // ─── Co-op Turn ───────────────────────────────────────────

  setCoopTurn(matchId: string, userId: string): void {
    this.coopTurn.set(matchId, userId);
  }

  getCoopTurn(matchId: string): string | undefined {
    return this.coopTurn.get(matchId);
  }

  // ─── Pending Answers (PvP) ────────────────────────────────

  getPendingAnswers(matchId: string): PendingAnswer[] {
    if (!this.pendingAnswers.has(matchId)) {
      this.pendingAnswers.set(matchId, []);
    }
    return this.pendingAnswers.get(matchId)!;
  }

  clearPendingAnswers(matchId: string): void {
    this.pendingAnswers.set(matchId, []);
  }

  // ─── Question Cache & Retrieval ───────────────────────────

  async getQuestionForMatch(matchId: string, index: number): Promise<CachedQuestion | null> {
    const match = await this.gameService.getMatch(matchId);
    if (!this.questionsCache.has(matchId)) {
      const questions = await this.gameService.getQuizQuestions(match.quiz.id);
      this.questionsCache.set(
        matchId,
        questions.map((q, i) => ({ id: q.id, text: q.text, options: q.options, index: i })),
      );
    }
    const questions = this.questionsCache.get(matchId)!;
    const q = questions[index];
    if (!q) return null;
    // Don't send correctAnswer to clients
    return { id: q.id, text: q.text, options: q.options, index };
  }

  // ─── Advance or Finish ────────────────────────────────────

  async advanceOrFinish(
    server: Server,
    matchId: string,
    type: string,
    totalQuestions: number,
  ): Promise<void> {
    const idx = this.getQuestionIndex(matchId) + 1;
    this.matchQuestionIndex.set(matchId, idx);

    if (idx >= totalQuestions) {
      setTimeout(async () => {
        const finished = await this.gameService.finishMatch(matchId);
        await this.awardRewards(finished);
        server.to(`match:${matchId}`).emit('match-finished', finished);
        this.cleanupMatch(matchId);
      }, RESULT_DISPLAY_MS);
      return;
    }

    setTimeout(async () => {
      const nextQuestion = await this.getQuestionForMatch(matchId, idx);
      server.to(`match:${matchId}`).emit('next-question', {
        question: nextQuestion,
        questionIndex: idx,
        currentTurn: this.coopTurn.get(matchId) || null,
      });
    }, RESULT_DISPLAY_MS);
  }

  // ─── Rewards ──────────────────────────────────────────────

  private async awardRewards(
    match: { type: MatchType; players?: { userId: string; isWinner: boolean }[] },
  ): Promise<void> {
    if (!match.players) return;
    for (const player of match.players) {
      let xp = 0;
      let coins = 0;
      if (match.type === 'SOLO') {
        xp = MATCH_REWARDS.SOLO.xp;
        coins = MATCH_REWARDS.SOLO.coins;
      } else if (match.type === 'COOP') {
        xp = MATCH_REWARDS.COOP.xp;
        coins = MATCH_REWARDS.COOP.coins;
      } else if (match.type === 'PVP') {
        if (player.isWinner) {
          xp = MATCH_REWARDS.PVP_WINNER.xp;
          coins = MATCH_REWARDS.PVP_WINNER.coins;
        } else {
          xp = MATCH_REWARDS.PVP_LOSER.xp;
          coins = MATCH_REWARDS.PVP_LOSER.coins;
        }
      }
      if (xp > 0 || coins > 0) {
        await this.usersService.addRewards(player.userId, xp, coins);
      }
      // Update daily streak for every player who completes a match
      await this.usersService.updateStreak(player.userId);
    }
  }

  // ─── Cleanup ──────────────────────────────────────────────

  cleanupMatch(matchId: string): void {
    this.matchQuestionIndex.delete(matchId);
    this.pendingAnswers.delete(matchId);
    this.coopTurn.delete(matchId);
    this.questionsCache.delete(matchId);
  }
}

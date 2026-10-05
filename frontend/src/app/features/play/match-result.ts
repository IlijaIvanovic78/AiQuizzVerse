import {
  MatchMode,
  MatchResult,
  MatchResultPlayer,
  MatchResultQuestion,
} from '../../core/models/match.model';
import { starsForAccuracy } from '../../shared/stars';
import { TEAM_WIN_ACCURACY } from './play.constants';

export type ResultTone = 'victory' | 'almost' | 'draw';

export interface ResultHeadline {
  title: string;
  subtitle: string;
  tone: ResultTone;
}

export interface RankedPlayer {
  rank: number;
  player: MatchResultPlayer;
}

const PLACE_NAMES = ['first', 'second', 'third', 'fourth'];

// Solo and team players fill a treasure chest; a party is played for points.
export function hasTreasureChest(mode: MatchMode): boolean {
  return mode === 'SOLO' || mode === 'TEAM';
}

// The chest is full when every player got every question right.
export function chestSize(playerCount: number, questionCount: number): number {
  return playerCount * questionCount;
}

export function chestLabelFor(mode: MatchMode): string {
  return mode === 'TEAM' ? 'Team chest' : 'Treasure chest';
}

export function accuracyPercent(correct: number, total: number): number {
  return total > 0 ? Math.round((correct / total) * 100) : 0;
}

// In a party only wrong answers count: a question someone else answered first is no mistake,
// and the server does not put it in the Mistakes notebook either.
export function missedQuestions(result: MatchResult): MatchResultQuestion[] {
  const missed = result.questions.filter((question) => question.myAnswer !== question.correctIndex);
  return result.mode === 'PARTY' ? missed.filter((question) => question.myAnswer !== null) : missed;
}

// All right answers in the match: the player's own in solo, both players' in a team.
export function correctAnswers(result: MatchResult): number {
  return result.players.reduce((sum, player) => sum + player.correctCount, 0);
}

export function findPlayer(result: MatchResult, userId: string): MatchResultPlayer | null {
  return result.players.find((player) => player.user.id === userId) ?? null;
}

// Highest score first; players with the same score share a place, like 1, 1, 3.
export function rankPlayers(players: MatchResultPlayer[]): RankedPlayer[] {
  const byScore = [...players].sort((a, b) => b.score - a.score);
  return byScore.map((player) => ({
    rank: 1 + byScore.filter((other) => other.score > player.score).length,
    player,
  }));
}

export function resultHeadline(result: MatchResult, meId: string): ResultHeadline {
  if (result.mode === 'PARTY') {
    return partyHeadline(result, meId);
  }
  if (result.mode === 'TEAM') {
    return teamHeadline(result, meId);
  }
  return soloHeadline(result, meId);
}

function soloHeadline(result: MatchResult, meId: string): ResultHeadline {
  const correct = findPlayer(result, meId)?.correctCount ?? 0;
  const score = `You got ${correct} of ${result.questionCount} right.`;
  if (starsForAccuracy(accuracyPercent(correct, result.questionCount)) === 0) {
    return { title: 'Almost! Try again for a star', subtitle: score, tone: 'almost' };
  }
  const title = result.kind === 'PATH_STEP' ? 'Step cleared!' : 'Victory!';
  return { title, subtitle: score, tone: 'victory' };
}

function partyHeadline(result: MatchResult, meId: string): ResultHeadline {
  const ranked = rankPlayers(result.players);
  const mine = ranked.find((entry) => entry.player.user.id === meId);
  if (mine?.player.isWinner) {
    return { title: 'Victory!', subtitle: 'You knew the most answers first!', tone: 'victory' };
  }
  if (mine?.rank === 1) {
    return { title: 'Draw!', subtitle: 'You share first place. What a close party!', tone: 'draw' };
  }
  const place = placeName(mine?.rank ?? ranked.length);
  return {
    title: 'Good fight!',
    subtitle: `You finished ${place} of ${ranked.length}. Ask for a rematch!`,
    tone: 'almost',
  };
}

function placeName(rank: number): string {
  return PLACE_NAMES[rank - 1] ?? 'last';
}

function teamHeadline(result: MatchResult, meId: string): ResultHeadline {
  const teamCorrect = correctAnswers(result);
  const teamTotal = chestSize(result.players.length, result.questionCount);
  const score = `Your team got ${teamCorrect} of ${teamTotal} right.`;
  if (findPlayer(result, meId)?.isWinner) {
    return { title: 'Team victory!', subtitle: score, tone: 'victory' };
  }
  return {
    title: 'So close!',
    subtitle: `${score} A team needs ${TEAM_WIN_ACCURACY}% to win.`,
    tone: 'almost',
  };
}

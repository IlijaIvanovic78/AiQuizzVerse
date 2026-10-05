import { MatchResult, MatchResultPlayer, MatchResultQuestion } from '../../core/models/match.model';
import { starsForAccuracy } from '../../shared/stars';
import { TEAM_WIN_ACCURACY } from './play.constants';

export type ResultTone = 'victory' | 'almost' | 'draw';

export interface ResultHeadline {
  title: string;
  subtitle: string;
  tone: ResultTone;
}

export function accuracyPercent(correct: number, total: number): number {
  return total > 0 ? Math.round((correct / total) * 100) : 0;
}

export function missedQuestions(result: MatchResult): MatchResultQuestion[] {
  return result.questions.filter((question) => question.myAnswer !== question.correctIndex);
}

// All right answers in the match: the player's own in solo, both players' in a team.
export function correctAnswers(result: MatchResult): number {
  return result.players.reduce((sum, player) => sum + player.correctCount, 0);
}

export function findPlayer(result: MatchResult, userId: string): MatchResultPlayer | null {
  return result.players.find((player) => player.user.id === userId) ?? null;
}

export function resultHeadline(result: MatchResult, meId: string): ResultHeadline {
  if (result.mode === 'DUEL') {
    return duelHeadline(result, meId);
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

function duelHeadline(result: MatchResult, meId: string): ResultHeadline {
  const rival = result.players.find((player) => player.user.id !== meId);
  const rivalName = rival?.user.username ?? 'your rival';
  if (findPlayer(result, meId)?.isWinner) {
    return { title: 'Victory!', subtitle: `You beat ${rivalName}. Well played!`, tone: 'victory' };
  }
  if (rival?.isWinner) {
    return {
      title: 'Good fight!',
      subtitle: `${rivalName} won this time. Ask for a rematch!`,
      tone: 'almost',
    };
  }
  return {
    title: 'Draw!',
    subtitle: `You and ${rivalName} are evenly matched.`,
    tone: 'draw',
  };
}

function teamHeadline(result: MatchResult, meId: string): ResultHeadline {
  const teamCorrect = correctAnswers(result);
  const teamTotal = result.players.length * result.questionCount;
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

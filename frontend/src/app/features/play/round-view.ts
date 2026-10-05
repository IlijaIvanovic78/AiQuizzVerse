import { MatchPlayerView } from '../../core/models/match.model';
import { MatchQuestionEvent, RoundResultEvent } from '../../core/models/realtime-events.model';

export type RoundOutcome = 'correct' | 'wrong' | 'missed' | 'beaten';

// How a teammate, a duel rival or a party opponent did in the round.
export interface OtherPlayerResult {
  name: string;
  answered: boolean;
  correct: boolean;
  points: number;
}

export interface OtherPick {
  name: string;
  optionIndex: number | null;
}

export interface RoundView {
  outcome: RoundOutcome;
  points: number;
  myPick: number | null;
  correctAnswer: string | null;
  others: OtherPlayerResult[];
  otherPicks: OtherPick[];
}

export function namesById(players: MatchPlayerView[]): Record<string, string> {
  const names: Record<string, string> = {};
  players.forEach((player) => (names[player.user.id] = player.user.username));
  return names;
}

// After a refresh during the reveal the question is unknown, so the answer text may be missing.
export function toRoundView(
  round: RoundResultEvent,
  question: MatchQuestionEvent | null,
  meId: string,
  names: Record<string, string>,
): RoundView {
  const mine = round.players.find((player) => player.userId === meId) ?? null;
  const others = round.players.filter((player) => player.userId !== meId);
  const sameQuestion = question?.index === round.index;
  return {
    outcome: outcomeOf(mine?.optionIndex ?? null, mine?.correct ?? false, round.winnerUserId),
    points: mine?.points ?? 0,
    myPick: mine?.optionIndex ?? null,
    correctAnswer: sameQuestion ? (question.options[round.correctIndex] ?? null) : null,
    others: others.map((player) => ({
      name: nameOf(names, player.userId),
      answered: player.optionIndex !== null,
      correct: player.correct,
      points: player.points,
    })),
    otherPicks: others.map((player) => ({
      name: nameOf(names, player.userId),
      optionIndex: player.optionIndex,
    })),
  };
}

function nameOf(names: Record<string, string>, userId: string): string {
  return names[userId] ?? 'Your friend';
}

// In a party the round ends when someone else is right first, which is not running out of time.
function outcomeOf(
  optionIndex: number | null,
  correct: boolean,
  winnerUserId: string | null,
): RoundOutcome {
  if (optionIndex === null) {
    return winnerUserId ? 'beaten' : 'missed';
  }
  return correct ? 'correct' : 'wrong';
}

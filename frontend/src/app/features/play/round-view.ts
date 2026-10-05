import { MatchQuestionEvent, RoundResultEvent } from '../../core/models/realtime-events.model';
import { OtherPick } from './components/answer-grid.component';
import { RoundOutcome, TeammateResult } from './components/reveal-panel.component';

export interface RoundView {
  outcome: RoundOutcome;
  points: number;
  myPick: number | null;
  correctAnswer: string | null;
  others: TeammateResult[];
  otherPicks: OtherPick[];
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
    outcome: outcomeOf(mine?.optionIndex ?? null, mine?.correct ?? false),
    points: mine?.points ?? 0,
    myPick: mine?.optionIndex ?? null,
    correctAnswer: sameQuestion ? (question.options[round.correctIndex] ?? null) : null,
    others: others.map((player) => ({
      name: names[player.userId] ?? 'Your friend',
      correct: player.correct,
      points: player.points,
    })),
    otherPicks: others.map((player) => ({
      name: names[player.userId] ?? 'Your friend',
      optionIndex: player.optionIndex,
    })),
  };
}

function outcomeOf(optionIndex: number | null, correct: boolean): RoundOutcome {
  if (optionIndex === null) {
    return 'missed';
  }
  return correct ? 'correct' : 'wrong';
}

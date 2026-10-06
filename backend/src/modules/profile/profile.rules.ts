import { accuracyPercent } from '../progression/progression.rules';
import { MatchStats, PlayedMatch, ThemeMastery } from './profile.types';

interface AnswerTotals {
  answered: number;
  correct: number;
}

export function matchStats(matches: PlayedMatch[]): MatchStats {
  const totals = addUpAnswers(matches);
  return {
    matchesPlayed: matches.length,
    wins: matches.filter((match) => match.outcome === 'WIN').length,
    questionsAnswered: totals.answered,
    accuracy: accuracyPercent(totals.correct, totals.answered),
  };
}

/** Accuracy per quiz theme, the most played theme first. */
export function masteryByTheme(matches: PlayedMatch[]): ThemeMastery[] {
  const themes = [...new Set(matches.map((match) => match.theme))];
  return themes
    .map((theme) => {
      const totals = addUpAnswers(matches.filter((match) => match.theme === theme));
      return {
        theme,
        accuracy: accuracyPercent(totals.correct, totals.answered),
        answered: totals.answered,
      };
    })
    .sort((first, second) => second.answered - first.answered);
}

function addUpAnswers(matches: PlayedMatch[]): AnswerTotals {
  return matches.reduce(
    (totals, match) => ({
      answered: totals.answered + questionsAsked(match),
      correct: totals.correct + match.correctCount,
    }),
    { answered: 0, correct: 0 },
  );
}

// The owner can delete questions after a match, so the quiz may now have fewer questions
// than the player got right; counting those keeps accuracy at 100% at most.
function questionsAsked(match: PlayedMatch): number {
  return Math.max(match.questionCount, match.correctCount);
}

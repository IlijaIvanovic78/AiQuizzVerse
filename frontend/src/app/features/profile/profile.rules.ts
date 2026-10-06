import { HttpErrorResponse, HttpStatusCode } from '@angular/common/http';
import { readErrorMessage } from '../../core/api/api-error';
import { MatchMode, MatchOutcome } from '../../core/models/match.model';
import { ProfileView } from '../../core/models/profile.model';
import { PixelIconName } from '../../shared/components/pixel-icon.component';
import { OUTCOME_LOOKS, SO_CLOSE_LOOK, TEAM_VICTORY_LOOK } from './profile.constants';
import { OutcomeLook, ProfileState } from './profile.types';

interface StatTile {
  label: string;
  value: string | number;
  icon: PixelIconName;
}

// A name that is not found is a normal answer ("no hero by that name"), not an error.
export function failedState(error: unknown): ProfileState {
  if (error instanceof HttpErrorResponse && error.status === HttpStatusCode.NotFound) {
    return { status: 'missing' };
  }
  return { status: 'failed', message: readErrorMessage(error) };
}

// Mistakes are private, so only the player's own profile shows how many are waiting.
export function statTilesFor({ stats, user, relation }: ProfileView): StatTile[] {
  const tiles: StatTile[] = [
    { label: 'Matches played', value: stats.matchesPlayed, icon: 'bolt' },
    { label: 'Wins', value: stats.wins, icon: 'trophy' },
    { label: 'Questions answered', value: stats.questionsAnswered, icon: 'check' },
    { label: 'Accuracy', value: `${stats.accuracy}%`, icon: 'star-empty' },
    { label: 'Quizzes created', value: stats.quizzesCreated, icon: 'heart' },
    { label: 'Path stars', value: stats.pathStars, icon: 'star' },
    { label: 'Best streak', value: user.longestStreak, icon: 'flame' },
  ];
  if (relation === 'SELF') {
    tiles.push({ label: 'Mistakes to review', value: stats.mistakesToReview, icon: 'cross' });
  }
  return tiles;
}

// The stored outcome of a match in my history. A team match is won or lost together, so it gets
// team words.
export function outcomeLook(mode: MatchMode, outcome: MatchOutcome): OutcomeLook {
  if (mode === 'TEAM') {
    return outcome === 'WIN' ? TEAM_VICTORY_LOOK : SO_CLOSE_LOOK;
  }
  return OUTCOME_LOOKS[outcome];
}

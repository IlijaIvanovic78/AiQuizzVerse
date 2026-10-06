import { HttpErrorResponse } from '@angular/common/http';
import { ProfileRelation, ProfileView } from '../../core/models/profile.model';
import { failedState, outcomeLook, statTilesFor } from './profile.rules';

function profile(relation: ProfileRelation): ProfileView {
  return {
    user: {
      id: 'user-1',
      username: 'brave_owl',
      avatarKey: 'mini-mage',
      petKey: null,
      level: 3,
      xp: 250,
      streak: 2,
      longestStreak: 5,
      memberSince: '2026-09-01T10:00:00.000Z',
    },
    stats: {
      matchesPlayed: 12,
      wins: 4,
      questionsAnswered: 80,
      accuracy: 75,
      quizzesCreated: 3,
      pathStars: 9,
      mistakesToReview: 6,
    },
    mastery: [],
    relation,
    friendshipId: null,
  };
}

describe('statTilesFor', () => {
  it('shows the mistakes to review on my own profile', () => {
    const labels = statTilesFor(profile('SELF')).map((tile) => tile.label);

    expect(labels).toContain('Mistakes to review');
  });

  it('keeps the mistakes of other players private', () => {
    const labels = statTilesFor(profile('FRIEND')).map((tile) => tile.label);

    expect(labels).not.toContain('Mistakes to review');
  });
});

describe('failedState', () => {
  it('treats an unknown name as a missing hero', () => {
    const notFound = new HttpErrorResponse({ status: 404 });

    expect(failedState(notFound)).toEqual({ status: 'missing' });
  });

  it('keeps the server message for other errors', () => {
    const serverError = new HttpErrorResponse({ status: 500, error: { message: 'Try later' } });

    expect(failedState(serverError)).toEqual({ status: 'failed', message: 'Try later' });
  });
});

describe('outcomeLook', () => {
  it('shows the stored party outcome', () => {
    expect(outcomeLook('PARTY', 'WIN').label).toBe('Victory');
    expect(outcomeLook('PARTY', 'DRAW').label).toBe('Draw');
    expect(outcomeLook('PARTY', 'LOSS').label).toBe('Good fight');
  });

  it('uses team words for a team match', () => {
    expect(outcomeLook('TEAM', 'WIN').label).toBe('Team victory');
    expect(outcomeLook('TEAM', 'DONE').label).toBe('So close');
  });

  it('calls a solo match finished', () => {
    expect(outcomeLook('SOLO', 'DONE').label).toBe('Finished');
  });
});

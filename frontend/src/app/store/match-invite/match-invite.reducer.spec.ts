import { MatchInvite } from '../../core/models/realtime-events.model';
import { MatchActions } from '../match/match.actions';
import { matchInviteFeature } from './match-invite.reducer';

const reducer = matchInviteFeature.reducer;

const invite: MatchInvite = {
  matchId: 'match-2',
  inviteCode: 'ABC234',
  mode: 'PARTY',
  quizTitle: 'Animals of the World',
  from: { id: 'friend', username: 'demo_friend', avatarKey: null, petKey: null, level: 4 },
};

describe('match invite reducer', () => {
  it('keeps a received invite while the player moves between pages', () => {
    const received = reducer(undefined, MatchActions.inviteReceived({ invite }));

    const state = reducer(received, MatchActions.left());

    expect(state.invite).toEqual(invite);
  });

  it('forgets the invite once it is accepted or dismissed', () => {
    const received = reducer(undefined, MatchActions.inviteReceived({ invite }));

    const accepted = reducer(received, MatchActions.inviteAccepted({ invite }));
    const dismissed = reducer(received, MatchActions.inviteDismissed());

    expect(accepted.invite).toBeNull();
    expect(dismissed.invite).toBeNull();
  });
});

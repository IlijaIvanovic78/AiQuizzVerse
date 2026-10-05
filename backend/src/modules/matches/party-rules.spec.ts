import {
  chargesAfterRoundWin,
  SabotageAttempt,
  sabotageError,
  scoreAfterWrongAnswer,
  startingCharges,
} from './party-rules';

describe('sabotage charges', () => {
  it('start at one in a party and at zero everywhere else', () => {
    expect(startingCharges('PARTY')).toBe(1);
    expect(startingCharges('DUEL')).toBe(0);
    expect(startingCharges('SOLO')).toBe(0);
  });

  it('grow by one for every round won, up to two', () => {
    expect(chargesAfterRoundWin(0)).toBe(1);
    expect(chargesAfterRoundWin(1)).toBe(2);
    expect(chargesAfterRoundWin(2)).toBe(2);
  });
});

describe('a wrong party answer', () => {
  it('costs 25 points', () => {
    expect(scoreAfterWrongAnswer(140)).toBe(115);
  });

  it('never takes the score below zero', () => {
    expect(scoreAfterWrongAnswer(10)).toBe(0);
    expect(scoreAfterWrongAnswer(0)).toBe(0);
  });
});

describe('sabotage validation', () => {
  const valid: SabotageAttempt = {
    mode: 'PARTY',
    questionOpen: true,
    fromUserId: 'ana',
    targetUserId: 'marko',
    charges: 1,
    alreadySabotaged: false,
    target: { connected: true, canAnswer: true },
  };

  it('allows a sabotage on a player who is still thinking', () => {
    expect(sabotageError(valid)).toBeNull();
  });

  it('works only in party matches', () => {
    expect(sabotageError({ ...valid, mode: 'DUEL' })).toMatch(/only for party/);
  });

  it('works only while a question is open', () => {
    expect(sabotageError({ ...valid, questionOpen: false })).toMatch(/question is open/);
  });

  it('allows one sabotage per question', () => {
    expect(sabotageError({ ...valid, charges: 2, alreadySabotaged: true })).toMatch(/One sabotage/);
  });

  it('needs a charge', () => {
    expect(sabotageError({ ...valid, charges: 0 })).toMatch(/No sabotage charges/);
  });

  it('cannot target yourself', () => {
    expect(sabotageError({ ...valid, targetUserId: 'ana' })).toMatch(/not yourself/);
  });

  it('needs a target who plays, is here and has not answered yet', () => {
    expect(sabotageError({ ...valid, target: null })).toMatch(/not in this match/);
    expect(sabotageError({ ...valid, target: { connected: false, canAnswer: false } })).toMatch(
      /not here/,
    );
    expect(sabotageError({ ...valid, target: { connected: true, canAnswer: false } })).toMatch(
      /already answered/,
    );
  });
});

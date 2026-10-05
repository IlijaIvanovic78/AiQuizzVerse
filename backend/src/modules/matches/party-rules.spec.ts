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
    expect(startingCharges('TEAM')).toBe(0);
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
  const marko = { userId: 'marko', connected: true, canAnswer: true };
  const valid: SabotageAttempt = {
    mode: 'PARTY',
    type: 'FOG',
    owned: true,
    questionOpen: true,
    fromUserId: 'ana',
    charges: 1,
    alreadySabotaged: false,
    target: marko,
  };

  it('allows a sabotage on a player who is still thinking', () => {
    expect(sabotageError(valid)).toBeNull();
  });

  it('works only in party matches', () => {
    expect(sabotageError({ ...valid, mode: 'TEAM' })).toMatch(/only for party/);
  });

  it('needs to be bought in the shop first, even with charges to spare', () => {
    expect(sabotageError({ ...valid, owned: false, charges: 2 })).toMatch(/get it in the shop/);
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
    expect(sabotageError({ ...valid, target: { ...marko, userId: 'ana' } })).toMatch(
      /not yourself/,
    );
  });

  it('needs a target who plays, is here and has not answered yet', () => {
    expect(sabotageError({ ...valid, target: null })).toMatch(/not in this match/);
    expect(sabotageError({ ...valid, target: { ...marko, connected: false } })).toMatch(/not here/);
    expect(sabotageError({ ...valid, target: { ...marko, canAnswer: false } })).toMatch(
      /already answered/,
    );
  });
});

describe('a shield', () => {
  const ana = { userId: 'ana', connected: true, canAnswer: true };
  const shield: SabotageAttempt = {
    mode: 'PARTY',
    type: 'SHIELD',
    owned: true,
    questionOpen: true,
    fromUserId: 'ana',
    charges: 1,
    alreadySabotaged: false,
    target: ana,
  };

  it('goes on yourself while you can still answer', () => {
    expect(sabotageError(shield)).toBeNull();
  });

  it('is not allowed after you answered', () => {
    expect(sabotageError({ ...shield, target: { ...ana, canAnswer: false } })).toMatch(
      /before you answer/,
    );
  });

  it('costs a charge and counts as the sabotage of the round', () => {
    expect(sabotageError({ ...shield, charges: 0 })).toMatch(/No sabotage charges/);
    expect(sabotageError({ ...shield, alreadySabotaged: true })).toMatch(/One sabotage/);
  });
});

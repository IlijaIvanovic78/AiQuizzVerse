import {
  MatchOptionOrders,
  pickWrongOptions,
  showOptions,
  toShownIndex,
  toStoredIndex,
} from './option-order';

describe('option order', () => {
  const options = ['Mars', 'Jupiter', 'Venus', 'Saturn'];
  const order = [2, 0, 3, 1];

  it('shows the options in the shuffled order', () => {
    expect(showOptions(options, order)).toEqual(['Venus', 'Mars', 'Saturn', 'Jupiter']);
  });

  it('maps a shown answer back to the stored option and the other way round', () => {
    expect(toStoredIndex(order, 3)).toBe(1);
    expect(toShownIndex(order, 1)).toBe(3);
  });

  it('picks only wrong options for fifty-fifty', () => {
    const removed = pickWrongOptions(order, 1, 2);

    expect(removed).toHaveLength(2);
    expect(removed).not.toContain(3);
    expect(removed).toEqual([...removed].sort((a, b) => a - b));
  });
});

describe('option orders per player', () => {
  it('shuffles every question once, using every option exactly once', () => {
    const orders = new MatchOptionOrders([4, 4]);

    expect([...orders.shared(0)].sort()).toEqual([0, 1, 2, 3]);
    expect([...orders.shared(1)].sort()).toEqual([0, 1, 2, 3]);
  });

  it('gives every player the shared order until a scramble', () => {
    const orders = new MatchOptionOrders([4]);

    expect(orders.forPlayer('ana', 0)).toEqual(orders.shared(0));
    expect(orders.forPlayer('marko', 0)).toEqual(orders.shared(0));
  });

  it('scrambles one question for one player and moves every option', () => {
    const orders = new MatchOptionOrders([4, 4]);
    const shared = orders.shared(0);

    const scrambled = orders.scramble('marko', 0);

    expect(orders.forPlayer('marko', 0)).toEqual(scrambled);
    expect([...scrambled].sort()).toEqual([0, 1, 2, 3]);
    expect(scrambled.every((storedIndex, shownIndex) => storedIndex !== shared[shownIndex])).toBe(
      true,
    );
    expect(orders.forPlayer('ana', 0)).toEqual(shared);
    expect(orders.forPlayer('marko', 1)).toEqual(orders.shared(1));
  });
});

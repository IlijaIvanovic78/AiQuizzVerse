import {
  pickWrongOptions,
  showOptions,
  shuffledOptionOrder,
  toShownIndex,
  toStoredIndex,
} from './option-order';

describe('option order', () => {
  const options = ['Mars', 'Jupiter', 'Venus', 'Saturn'];
  const order = [2, 0, 3, 1];

  it('uses every option exactly once', () => {
    expect([...shuffledOptionOrder(4)].sort()).toEqual([0, 1, 2, 3]);
  });

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

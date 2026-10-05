import { shuffle } from './shuffle';

describe('shuffle', () => {
  it('keeps every item exactly once', () => {
    const items = [1, 2, 3, 4, 5];

    expect(shuffle(items).sort()).toEqual(items);
  });

  it('does not change the original array', () => {
    const items = ['a', 'b', 'c'];

    shuffle(items);

    expect(items).toEqual(['a', 'b', 'c']);
  });

  it('uses the random source to pick positions', () => {
    const alwaysFirst = () => 0;

    expect(shuffle([1, 2, 3, 4], alwaysFirst)).toEqual([2, 3, 4, 1]);
  });
});

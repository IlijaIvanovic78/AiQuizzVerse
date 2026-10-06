import { tabIndexAfterKey } from './tabs';

describe('tabIndexAfterKey', () => {
  it('moves to the next and the previous tab with the arrow keys', () => {
    expect(tabIndexAfterKey('ArrowRight', 0, 3)).toBe(1);
    expect(tabIndexAfterKey('ArrowLeft', 2, 3)).toBe(1);
  });

  it('wraps around at both ends', () => {
    expect(tabIndexAfterKey('ArrowRight', 2, 3)).toBe(0);
    expect(tabIndexAfterKey('ArrowLeft', 0, 3)).toBe(2);
  });

  it('ignores every other key', () => {
    expect(tabIndexAfterKey('Enter', 1, 3)).toBeNull();
    expect(tabIndexAfterKey('Tab', 1, 3)).toBeNull();
  });
});

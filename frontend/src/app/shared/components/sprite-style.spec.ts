import { SpriteEntry } from '../../core/models/sprite.model';
import { spriteStyle } from './sprite-style';

describe('spriteStyle', () => {
  const mage: SpriteEntry = {
    key: 'mini-mage',
    type: 'hero',
    name: 'Mage',
    sheet: 'heroes/mini-mage.png',
    frameWidth: 32,
    frameHeight: 32,
    frames: 4,
    fps: 8,
  };

  it('scales one frame and the whole strip', () => {
    const style = spriteStyle(mage, '/assets/sprites/heroes/mini-mage.png', 3);

    expect(style['width']).toBe('96px');
    expect(style['height']).toBe('96px');
    expect(style['background-size']).toBe('384px 96px');
    expect(style['--sprite-sheet-width']).toBe('384px');
  });

  it('plays every frame once per loop', () => {
    const style = spriteStyle(mage, '/assets/sprites/heroes/mini-mage.png', 4);

    expect(style['animation-duration']).toBe('0.5s');
    expect(style['animation-timing-function']).toBe('steps(4)');
  });
});

export const ICONS_URL = '/assets/images/icons/';

// The painted item pictures. The small 16px icons are PNGs and are drawn by PixelIconComponent.
export type ItemImageName = 'sword' | 'axes' | 'chest' | 'shield' | 'potion' | 'treasure';

export function itemIconUrl(name: ItemImageName): string {
  return `${ICONS_URL}${name}.webp`;
}

export interface Pixel {
  x: number;
  y: number;
  color: string;
}

// Small pictures are drawn as rows of letters, one letter per pixel.
// Letters without a color, like '.', stay empty.
export function toPixels(rows: string[], colors: Record<string, string>): Pixel[] {
  const pixels: Pixel[] = [];
  rows.forEach((row, y) => {
    row.split('').forEach((letter, x) => {
      if (letter in colors) {
        pixels.push({ x, y, color: colors[letter] });
      }
    });
  });
  return pixels;
}

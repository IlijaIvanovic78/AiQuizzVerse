// Like a learning path step, a game earns a star at 60%, 80% and 100% correct answers.
export const STAR_ACCURACIES = [60, 80, 100];

// A results screen pops the earned stars in one after another. Each pop is at its biggest
// STAR_POP_PEAK_MS after it starts (70% of the star-pop animation in styles.css).
export const STAR_POP_DELAY_MS = 180;
export const STAR_POP_PEAK_MS = 315;

export function starsForAccuracy(accuracy: number): number {
  return STAR_ACCURACIES.filter((needed) => accuracy >= needed).length;
}

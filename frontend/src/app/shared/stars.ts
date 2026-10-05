// Like a learning path step, a game earns a star at 60%, 80% and 100% correct answers.
export const STAR_ACCURACIES = [60, 80, 100];

export function starsForAccuracy(accuracy: number): number {
  return STAR_ACCURACIES.filter((needed) => accuracy >= needed).length;
}

import { shuffle } from '../../common/utils/shuffle';

/** order[shownIndex] is the index of that option in the stored question. */
export type OptionOrder = number[];

export function shuffledOptionOrder(optionCount: number): OptionOrder {
  return shuffle(Array.from({ length: optionCount }, (_, index) => index));
}

export function showOptions(options: string[], order: OptionOrder): string[] {
  return order.map((storedIndex) => options[storedIndex]);
}

export function toStoredIndex(order: OptionOrder, shownIndex: number): number {
  return order[shownIndex];
}

export function toShownIndex(order: OptionOrder, storedIndex: number): number {
  return order.indexOf(storedIndex);
}

/** Random wrong options in the shown order, sorted so the client can grey them out. */
export function pickWrongOptions(
  order: OptionOrder,
  correctStoredIndex: number,
  count: number,
): number[] {
  const correctShownIndex = toShownIndex(order, correctStoredIndex);
  const wrongShownIndexes = order
    .map((_, shownIndex) => shownIndex)
    .filter((shownIndex) => shownIndex !== correctShownIndex);
  return shuffle(wrongShownIndexes)
    .slice(0, count)
    .sort((a, b) => a - b);
}

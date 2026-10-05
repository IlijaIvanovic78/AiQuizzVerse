import { shuffle } from '../../common/utils/shuffle';

/** order[shownIndex] is the index of that option in the stored question. */
export type OptionOrder = number[];

/**
 * The option orders of one match: every question is shuffled once and everyone sees that
 * order, until a SCRAMBLE gives one player a private order for one question.
 */
export class MatchOptionOrders {
  private readonly sharedOrders: OptionOrder[];
  private readonly privateOrders = new Map<string, OptionOrder>();

  constructor(optionCounts: number[]) {
    this.sharedOrders = optionCounts.map((count) => shuffledOptionOrder(count));
  }

  shared(questionIndex: number): OptionOrder {
    return this.sharedOrders[questionIndex];
  }

  forPlayer(userId: string, questionIndex: number): OptionOrder {
    const privateOrder = this.privateOrders.get(privateKey(userId, questionIndex));
    return privateOrder ?? this.sharedOrders[questionIndex];
  }

  scramble(userId: string, questionIndex: number): OptionOrder {
    const order = scrambledOptionOrder(this.forPlayer(userId, questionIndex));
    this.privateOrders.set(privateKey(userId, questionIndex), order);
    return order;
  }
}

function shuffledOptionOrder(optionCount: number): OptionOrder {
  return shuffle(Array.from({ length: optionCount }, (_, index) => index));
}

/** A new order where every option moves, so a scramble is always visible. */
function scrambledOptionOrder(current: OptionOrder): OptionOrder {
  let next = shuffledOptionOrder(current.length);
  while (next.some((storedIndex, shownIndex) => storedIndex === current[shownIndex])) {
    next = shuffledOptionOrder(current.length);
  }
  return next;
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

function privateKey(userId: string, questionIndex: number): string {
  return `${userId}:${questionIndex}`;
}

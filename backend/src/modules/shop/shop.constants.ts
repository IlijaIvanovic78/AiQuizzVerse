import { EXTRA_TIME_MS, MS_PER_SECOND } from '../matches/matches.constants';
import { BoostCatalogEntry } from './shop.types';

export const ITEM_NOT_FOUND_MESSAGE = 'We could not find that item.';

export const BOOST_CATALOG: BoostCatalogEntry[] = [
  {
    type: 'HINT',
    name: 'Hint',
    description: 'Shows a clue that helps you think. It never gives the answer away.',
    price: 10,
  },
  {
    type: 'FIFTY_FIFTY',
    name: '50/50',
    description: 'Removes two wrong answers.',
    price: 15,
  },
  {
    type: 'EXTRA_TIME',
    name: 'Extra time',
    description: `Adds ${EXTRA_TIME_MS / MS_PER_SECOND} seconds to the timer.`,
    price: 10,
  },
  {
    type: 'SECOND_CHANCE',
    name: 'Second chance',
    description: 'If your answer is wrong, you can try once more for half the points.',
    price: 20,
  },
  {
    type: 'STREAK_FREEZE',
    name: 'Streak freeze',
    description: 'Keeps your streak safe when you miss a day. Find it in golden chests.',
    price: null,
  },
];

import { BoostCatalogEntry } from './shop.types';

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
    description: 'Adds 15 seconds to the timer.',
    price: 10,
  },
  {
    type: 'STREAK_FREEZE',
    name: 'Streak freeze',
    description: 'Keeps your streak safe when you miss a day. Earn it on learning paths.',
    price: null,
  },
];

export const NOT_ENOUGH_COINS_MESSAGE = 'Not enough coins. Play quizzes to earn more coins.';

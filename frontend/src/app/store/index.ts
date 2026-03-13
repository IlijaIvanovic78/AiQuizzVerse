import { AppStatusState } from './app-status/app-status.state';
import { AvatarState } from './avatar/avatar.state';
import { GameState } from './game/game.state';
import { QuizState } from './quiz/quiz.state';
import { RankedState } from './ranked/ranked.state';
import { ShopState } from './shop/shop.state';

export interface AppState {
  appStatus: AppStatusState;
  avatar: AvatarState;
  game: GameState;
  quiz: QuizState;
  ranked: RankedState;
  shop: ShopState;
}

export * from './app-status';
export * from './avatar';
export * from './game';
export * from './quiz';
export * from './ranked';
export * from './shop';

import { AppStatusState } from './app-status/app-status.state';
import { AvatarState } from './avatar/avatar.state';
import { GameState } from './game/game.state';
import { LeaderboardState } from './leaderboard/leaderboard.state';
import { MatchHistoryState } from './match-history/match-history.state';
import { QuizState } from './quiz/quiz.state';
import { RankedState } from './ranked/ranked.state';
import { ShopState } from './shop/shop.state';

export interface AppState {
  appStatus: AppStatusState;
  avatar: AvatarState;
  game: GameState;
  leaderboard: LeaderboardState;
  matchHistory: MatchHistoryState;
  quiz: QuizState;
  ranked: RankedState;
  shop: ShopState;
}

export * from './app-status';
export * from './avatar';
export * from './game';
export * from './leaderboard';
export * from './match-history';
export * from './quiz';
export * from './ranked';
export * from './shop';

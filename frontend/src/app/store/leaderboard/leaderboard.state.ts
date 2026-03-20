import { LeaderboardEntry } from '../../models/leaderboard.model';

export interface LeaderboardState {
  globalRanking: LeaderboardEntry[];
  friendsRanking: LeaderboardEntry[];
  loading: boolean;
  error: string | null;
}

export const initialLeaderboardState: LeaderboardState = {
  globalRanking: [],
  friendsRanking: [],
  loading: false,
  error: null,
};

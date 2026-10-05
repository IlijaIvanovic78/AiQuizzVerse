import { PublicUser } from '../users/users.types';

export type LeaderboardScope = 'friends' | 'global';

export interface LeaderboardEntry {
  rank: number;
  user: PublicUser;
  weeklyXp: number;
}

export interface LeaderboardMe {
  rank: number | null;
  weeklyXp: number;
}

export interface Leaderboard {
  period: 'week';
  entries: LeaderboardEntry[];
  me: LeaderboardMe;
}

export type RankedPlayer = Omit<LeaderboardEntry, 'rank'>;

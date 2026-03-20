export interface LeaderboardEntry {
  id: string;
  username: string;
  avatarUrl: string | null;
  xp: number;
  level: number;
  streak: number;
}

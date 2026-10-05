import { QuizTheme } from '@prisma/client';
import { FriendRelation } from '../friends/friends.types';
import { PublicUser } from '../users/users.types';

export type ProfileRelation = 'SELF' | FriendRelation;

export interface ProfileUser extends PublicUser {
  xp: number;
  streak: number;
  longestStreak: number;
  memberSince: Date;
}

export interface ProfileStats {
  matchesPlayed: number;
  wins: number;
  questionsAnswered: number;
  /** 0-100 */
  accuracy: number;
  quizzesCreated: number;
  pathStars: number;
  mistakesToReview: number;
}

export interface ThemeMastery {
  theme: QuizTheme;
  accuracy: number;
  answered: number;
}

export interface ProfileView {
  user: ProfileUser;
  stats: ProfileStats;
  mastery: ThemeMastery[];
  relation: ProfileRelation;
  friendshipId: string | null;
}

/** One finished match of the player, reduced to what the stats need. */
export interface PlayedMatch {
  theme: QuizTheme;
  questionCount: number;
  correctCount: number;
  isWinner: boolean;
}

export type MatchStats = Pick<
  ProfileStats,
  'matchesPlayed' | 'wins' | 'questionsAnswered' | 'accuracy'
>;

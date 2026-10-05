import { FriendRelation } from './friend.model';
import { QuizTheme } from './quiz.model';
import { PublicUser } from './user.model';

export type ProfileRelation = 'SELF' | FriendRelation;

export interface ProfileUser extends PublicUser {
  xp: number;
  streak: number;
  longestStreak: number;
  memberSince: string;
}

export interface ProfileStats {
  matchesPlayed: number;
  wins: number;
  questionsAnswered: number;
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

export interface UpdateProfileRequest {
  username: string;
}

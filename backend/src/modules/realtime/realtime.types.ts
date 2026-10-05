import { MatchMode } from '@prisma/client';
import { Server, Socket } from 'socket.io';
import { ChestView } from '../chests/chests.types';
import { Friend, FriendRequest } from '../friends/friends.types';
import { PublicUser } from '../users/users.types';

export type GenerationStep = 'reading' | 'writing' | 'reviewing' | 'saving';

export interface QuizProgress {
  step: GenerationStep;
  done: number;
  total: number;
}

export interface DuelInvite {
  matchId: string;
  inviteCode: string;
  mode: MatchMode;
  quizTitle: string;
  from: PublicUser;
}

export interface ServerToClientEvents {
  'friend:online': (payload: { userId: string }) => void;
  'friend:offline': (payload: { userId: string }) => void;
  'friend:request': (payload: FriendRequest) => void;
  'friend:accepted': (payload: Friend) => void;
  'friend:request-removed': (payload: { requestId: string }) => void;
  'friend:removed': (payload: { friendshipId: string }) => void;
  'duel:invite': (payload: DuelInvite) => void;
  'quiz:progress': (payload: QuizProgress) => void;
  'coins:updated': (payload: { coins: number }) => void;
  'chest:earned': (payload: { chest: ChestView }) => void;
}

export type ClientToServerEvents = Record<string, never>;

export interface SocketData {
  userId: string;
}

export type RealtimeServer = Server<
  ClientToServerEvents,
  ServerToClientEvents,
  Record<string, never>,
  SocketData
>;

export type RealtimeSocket = Socket<
  ClientToServerEvents,
  ServerToClientEvents,
  Record<string, never>,
  SocketData
>;

export type UnauthenticatedSocket = Pick<Socket, 'handshake'> & { data: Partial<SocketData> };

import { Match, MatchPlayer } from '../../models/game.model';

export type MatchHistoryEntry = MatchPlayer & { match: Match };

export interface MatchHistoryState {
  matches: MatchHistoryEntry[];
  loading: boolean;
  error: string | null;
}

export const initialMatchHistoryState: MatchHistoryState = {
  matches: [],
  loading: false,
  error: null,
};

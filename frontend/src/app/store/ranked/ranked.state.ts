import { RankedJourney } from '../../models';

export interface RankedState {
  journeys: RankedJourney[];
  currentJourney: RankedJourney | null;
  loading: boolean;
  error: string | null;
}

export const initialRankedState: RankedState = {
  journeys: [],
  currentJourney: null,
  loading: false,
  error: null,
};

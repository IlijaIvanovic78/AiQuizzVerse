import { ProfileView } from '../../core/models/profile.model';

export type ProfileState =
  | { status: 'loading' }
  | { status: 'ready'; profile: ProfileView }
  | { status: 'missing' }
  | { status: 'failed'; message: string };

// The badge of a match in the match history.
export interface OutcomeLook {
  label: string;
  badge: string;
}

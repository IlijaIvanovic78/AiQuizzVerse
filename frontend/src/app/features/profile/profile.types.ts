import { ProfileView } from '../../core/models/profile.model';

export type ProfileState =
  | { status: 'loading' }
  | { status: 'ready'; profile: ProfileView }
  | { status: 'missing' }
  | { status: 'failed'; message: string };

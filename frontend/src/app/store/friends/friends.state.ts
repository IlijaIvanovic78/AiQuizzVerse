import { EntityState, EntityAdapter, createEntityAdapter } from '@ngrx/entity';
import { Friend, FriendRequest, SentFriendRequest, UserSearchResult } from '../../models';

export interface FriendsState extends EntityState<Friend> {
  pendingRequests: FriendRequest[];
  sentRequests: SentFriendRequest[];
  searchResults: UserSearchResult[];
  loading: boolean;
  error: string | null;
}

export const friendsAdapter: EntityAdapter<Friend> = createEntityAdapter<Friend>({
  selectId: (friend) => friend.id,
  sortComparer: (a, b) => {
    // Sort online friends first, then by username
    if (a.status === 'online' && b.status === 'offline') return -1;
    if (a.status === 'offline' && b.status === 'online') return 1;
    return a.username.localeCompare(b.username);
  },
});

export const initialFriendsState: FriendsState = friendsAdapter.getInitialState({
  pendingRequests: [],
  sentRequests: [],
  searchResults: [],
  loading: false,
  error: null,
});

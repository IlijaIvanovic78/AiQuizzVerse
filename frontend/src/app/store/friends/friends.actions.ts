import { createActionGroup, emptyProps, props } from '@ngrx/store';
import {
  Friend,
  FriendRequest,
  FriendRequestOutcome,
  FriendRequests,
  UserSearchResult,
} from '../../core/models/friend.model';

export const FriendsActions = createActionGroup({
  source: 'Friends',
  events: {
    Load: emptyProps(),
    Loaded: props<{ friends: Friend[] }>(),
    'Load Requests': emptyProps(),
    'Requests Loaded': props<{ requests: FriendRequests }>(),
    Search: props<{ query: string }>(),
    'Search Results Loaded': props<{ results: UserSearchResult[] }>(),
    'Send Request': props<{ userId: string }>(),
    'Request Sent': props<{ outcome: FriendRequestOutcome }>(),
    'Accept Request': props<{ requestId: string }>(),
    'Remove Request': props<{ requestId: string }>(),
    'Remove Friend': props<{ friendshipId: string }>(),
    'Request Received': props<{ request: FriendRequest }>(),
    'Friend Added': props<{ friend: Friend }>(),
    'Request Removed': props<{ requestId: string }>(),
    'Friend Removed': props<{ friendshipId: string }>(),
    'Presence Changed': props<{ userId: string; isOnline: boolean }>(),
    Failed: props<{ error: string }>(),
  },
});

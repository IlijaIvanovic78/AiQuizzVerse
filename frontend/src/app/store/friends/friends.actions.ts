import { createActionGroup, emptyProps, props } from '@ngrx/store';
import {
  Friend,
  FriendRequest,
  SentFriendRequest,
  UserSearchResult,
  FriendshipResponse,
} from '../../models';

export const FriendsActions = createActionGroup({
  source: 'Friends',
  events: {
    // Load Friends
    'Load Friends': emptyProps(),
    'Load Friends Success': props<{ friends: Friend[] }>(),
    'Load Friends Failure': props<{ error: string }>(),

    // Load Pending Requests
    'Load Pending Requests': emptyProps(),
    'Load Pending Requests Success': props<{ requests: FriendRequest[] }>(),
    'Load Pending Requests Failure': props<{ error: string }>(),

    // Load Sent Requests
    'Load Sent Requests': emptyProps(),
    'Load Sent Requests Success': props<{ requests: SentFriendRequest[] }>(),
    'Load Sent Requests Failure': props<{ error: string }>(),

    // Search Users
    'Search Users': props<{ query: string }>(),
    'Search Users Success': props<{ results: UserSearchResult[] }>(),
    'Search Users Failure': props<{ error: string }>(),
    'Clear Search Results': emptyProps(),

    // Send Friend Request
    'Send Friend Request': props<{ userId: string }>(),
    'Send Friend Request Success': props<{ friendship: FriendshipResponse }>(),
    'Send Friend Request Failure': props<{ error: string; userId: string }>(),

    // Accept Friend Request
    'Accept Friend Request': props<{ friendshipId: string }>(),
    'Accept Friend Request Success': props<{ friendship: FriendshipResponse }>(),
    'Accept Friend Request Failure': props<{ error: string; friendshipId: string }>(),

    // Reject Friend Request
    'Reject Friend Request': props<{ friendshipId: string }>(),
    'Reject Friend Request Success': props<{ friendshipId: string }>(),
    'Reject Friend Request Failure': props<{ error: string; friendshipId: string }>(),

    // Remove Friend
    'Remove Friend': props<{ friendshipId: string }>(),
    'Remove Friend Success': props<{ friendshipId: string }>(),
    'Remove Friend Failure': props<{ error: string; friendshipId: string }>(),

    // Socket Events
    'Friend Online': props<{ userId: string }>(),
    'Friend Offline': props<{ userId: string }>(),
    'Friend Request Received': props<{ request: FriendRequest }>(),
    'Friend Request Accepted Notification': props<{ friendshipId: string; friend: Friend }>(),

    // UI State
    'Set Loading': props<{ loading: boolean }>(),
    'Clear Error': emptyProps(),
  },
});

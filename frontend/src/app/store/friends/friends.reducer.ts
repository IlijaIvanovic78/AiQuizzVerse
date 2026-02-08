import { createReducer, on } from '@ngrx/store';
import { FriendsActions } from './friends.actions';
import { friendsAdapter, initialFriendsState } from './friends.state';

export const friendsReducer = createReducer(
  initialFriendsState,

  // Load Friends
  on(FriendsActions.loadFriends, (state) => ({
    ...state,
    loading: true,
    error: null,
  })),
  on(FriendsActions.loadFriendsSuccess, (state, { friends }) =>
    friendsAdapter.setAll(friends, {
      ...state,
      loading: false,
    })
  ),
  on(FriendsActions.loadFriendsFailure, (state, { error }) => ({
    ...state,
    loading: false,
    error,
  })),

  // Load Pending Requests
  on(FriendsActions.loadPendingRequests, (state) => ({
    ...state,
    loading: true,
    error: null,
  })),
  on(FriendsActions.loadPendingRequestsSuccess, (state, { requests }) => ({
    ...state,
    pendingRequests: requests,
    loading: false,
  })),
  on(FriendsActions.loadPendingRequestsFailure, (state, { error }) => ({
    ...state,
    loading: false,
    error,
  })),

  // Load Sent Requests
  on(FriendsActions.loadSentRequests, (state) => ({
    ...state,
    loading: true,
    error: null,
  })),
  on(FriendsActions.loadSentRequestsSuccess, (state, { requests }) => ({
    ...state,
    sentRequests: requests,
    loading: false,
  })),
  on(FriendsActions.loadSentRequestsFailure, (state, { error }) => ({
    ...state,
    loading: false,
    error,
  })),

  // Search Users
  on(FriendsActions.searchUsers, (state) => ({
    ...state,
    loading: true,
    error: null,
  })),
  on(FriendsActions.searchUsersSuccess, (state, { results }) => ({
    ...state,
    searchResults: results,
    loading: false,
  })),
  on(FriendsActions.searchUsersFailure, (state, { error }) => ({
    ...state,
    loading: false,
    error,
  })),
  on(FriendsActions.clearSearchResults, (state) => ({
    ...state,
    searchResults: [],
  })),

  // Send Friend Request
  on(FriendsActions.sendFriendRequest, (state) => ({
    ...state,
    loading: true,
    error: null,
  })),
  on(FriendsActions.sendFriendRequestSuccess, (state, { friendship }) => ({
    ...state,
    loading: false,
    // Add to sent requests
    sentRequests: [
      ...state.sentRequests,
      {
        id: friendship.id,
        to: {
          id: friendship.receiverId,
          username: '',
          email: '',
          avatarUrl: null,
        },
        createdAt: friendship.createdAt,
      },
    ],
  })),
  on(FriendsActions.sendFriendRequestFailure, (state, { error }) => ({
    ...state,
    loading: false,
    error,
  })),

  // Accept Friend Request
  on(FriendsActions.acceptFriendRequest, (state) => ({
    ...state,
    loading: true,
    error: null,
  })),
  on(FriendsActions.acceptFriendRequestSuccess, (state, { friendship }) => ({
    ...state,
    loading: false,
    // Remove from pending requests
    pendingRequests: state.pendingRequests.filter((req) => req.id !== friendship.id),
  })),
  on(FriendsActions.acceptFriendRequestFailure, (state, { error }) => ({
    ...state,
    loading: false,
    error,
  })),

  // Reject Friend Request
  on(FriendsActions.rejectFriendRequest, (state) => ({
    ...state,
    loading: true,
    error: null,
  })),
  on(FriendsActions.rejectFriendRequestSuccess, (state, { friendshipId }) => ({
    ...state,
    loading: false,
    // Remove from pending requests
    pendingRequests: state.pendingRequests.filter((req) => req.id !== friendshipId),
  })),
  on(FriendsActions.rejectFriendRequestFailure, (state, { error }) => ({
    ...state,
    loading: false,
    error,
  })),

  // Remove Friend
  on(FriendsActions.removeFriend, (state) => ({
    ...state,
    loading: true,
    error: null,
  })),
  on(FriendsActions.removeFriendSuccess, (state, { friendshipId }) => {
    // Find and remove friend by friendship ID
    const friendToRemove = Object.values(state.entities).find(
      (friend) => friend?.id === friendshipId
    );
    if (friendToRemove) {
      return friendsAdapter.removeOne(friendToRemove.id, {
        ...state,
        loading: false,
      });
    }
    return { ...state, loading: false };
  }),
  on(FriendsActions.removeFriendFailure, (state, { error }) => ({
    ...state,
    loading: false,
    error,
  })),

  // Socket Events - Friend Online
  on(FriendsActions.friendOnline, (state, { userId }) => {
    const friend = Object.values(state.entities).find((f) => f?.userId === userId);
    if (friend) {
      return friendsAdapter.updateOne(
        {
          id: friend.id,
          changes: { status: 'online' },
        },
        state
      );
    }
    return state;
  }),

  // Socket Events - Friend Offline
  on(FriendsActions.friendOffline, (state, { userId }) => {
    const friend = Object.values(state.entities).find((f) => f?.userId === userId);
    if (friend) {
      return friendsAdapter.updateOne(
        {
          id: friend.id,
          changes: { status: 'offline' },
        },
        state
      );
    }
    return state;
  }),

  // Socket Events - Friend Request Received
  on(FriendsActions.friendRequestReceived, (state, { request }) => ({
    ...state,
    pendingRequests: [...state.pendingRequests, request],
  })),

  // Socket Events - Friend Request Accepted
  on(FriendsActions.friendRequestAcceptedNotification, (state, { friendshipId, friend }) =>
    friendsAdapter.addOne(friend, {
      ...state,
      // Remove from sent requests
      sentRequests: state.sentRequests.filter((req) => req.id !== friendshipId),
    })
  ),

  // UI State
  on(FriendsActions.setLoading, (state, { loading }) => ({
    ...state,
    loading,
  })),
  on(FriendsActions.clearError, (state) => ({
    ...state,
    error: null,
  }))
);

import { createFeatureSelector, createSelector } from '@ngrx/store';
import { FriendsState, friendsAdapter } from './friends.state';

// Feature selector
export const selectFriendsState = createFeatureSelector<FriendsState>('friends');

// EntityAdapter selectors
const { selectAll, selectEntities, selectIds, selectTotal } = friendsAdapter.getSelectors();

// Entity selectors
export const selectAllFriends = createSelector(selectFriendsState, selectAll);

export const selectFriendsEntities = createSelector(selectFriendsState, selectEntities);

export const selectFriendsIds = createSelector(selectFriendsState, selectIds);

export const selectTotalFriends = createSelector(selectFriendsState, selectTotal);

// Online friends
export const selectOnlineFriends = createSelector(selectAllFriends, (friends) =>
  friends.filter((friend) => friend.status === 'online')
);

// Offline friends
export const selectOfflineFriends = createSelector(selectAllFriends, (friends) =>
  friends.filter((friend) => friend.status === 'offline')
);

// Online friends count
export const selectOnlineFriendsCount = createSelector(
  selectOnlineFriends,
  (friends) => friends.length
);

// Pending requests
export const selectPendingRequests = createSelector(
  selectFriendsState,
  (state) => state.pendingRequests
);

export const selectPendingRequestsCount = createSelector(
  selectPendingRequests,
  (requests) => requests.length
);

// Sent requests
export const selectSentRequests = createSelector(
  selectFriendsState,
  (state) => state.sentRequests
);

export const selectSentRequestsCount = createSelector(
  selectSentRequests,
  (requests) => requests.length
);

// Search results
export const selectSearchResults = createSelector(
  selectFriendsState,
  (state) => state.searchResults
);

// Loading state
export const selectFriendsLoading = createSelector(
  selectFriendsState,
  (state) => state.loading
);

// Error state
export const selectFriendsError = createSelector(selectFriendsState, (state) => state.error);

// Check if user is a friend (by user ID)
export const selectIsFriend = (userId: string) =>
  createSelector(selectAllFriends, (friends) => friends.some((f) => f.userId === userId));

// Get friend by friendship ID
export const selectFriendById = (friendId: string) =>
  createSelector(selectFriendsEntities, (entities) => entities[friendId]);

// Check if friend is online (by user ID)
export const selectIsFriendOnline = (userId: string) =>
  createSelector(
    selectAllFriends,
    (friends) => friends.find((f) => f.userId === userId)?.status === 'online'
  );

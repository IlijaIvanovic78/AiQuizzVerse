import { EntityState, createEntityAdapter } from '@ngrx/entity';
import { createFeature, createReducer, createSelector, on } from '@ngrx/store';
import {
  Friend,
  FriendRelation,
  FriendRequest,
  FriendRequestOutcome,
  UserSearchResult,
} from '../../core/models/friend.model';
import { FriendsActions } from './friends.actions';

interface FriendsState extends EntityState<Friend> {
  loaded: boolean;
  loading: boolean;
  incoming: FriendRequest[];
  outgoing: FriendRequest[];
  searchResults: UserSearchResult[];
  searching: boolean;
  busy: boolean;
  error: string | null;
}

const friendsAdapter = createEntityAdapter<Friend>({
  selectId: (friend) => friend.friendshipId,
  sortComparer: (a, b) => a.user.username.localeCompare(b.user.username),
});
const { selectAll, selectEntities } = friendsAdapter.getSelectors();

const initialFriendsState: FriendsState = friendsAdapter.getInitialState({
  loaded: false,
  loading: false,
  incoming: [],
  outgoing: [],
  searchResults: [],
  searching: false,
  busy: false,
  error: null,
});

export const friendsFeature = createFeature({
  name: 'friends',
  reducer: createReducer(
    initialFriendsState,
    on(
      FriendsActions.load,
      FriendsActions.loadRequests,
      (state): FriendsState => ({ ...state, loading: true, error: null }),
    ),
    on(
      FriendsActions.loaded,
      (state, { friends }): FriendsState =>
        friendsAdapter.setAll(friends, { ...state, loaded: true, loading: false }),
    ),
    on(
      FriendsActions.requestsLoaded,
      (state, { requests }): FriendsState => ({
        ...state,
        incoming: requests.incoming,
        outgoing: requests.outgoing,
        loading: false,
      }),
    ),
    on(FriendsActions.search, (state): FriendsState => ({ ...state, searching: true })),
    on(
      FriendsActions.searchResultsLoaded,
      (state, { results }): FriendsState => ({
        ...state,
        searchResults: results,
        searching: false,
      }),
    ),
    on(
      FriendsActions.sendRequest,
      FriendsActions.acceptRequest,
      FriendsActions.removeRequest,
      FriendsActions.removeFriend,
      (state): FriendsState => ({ ...state, busy: true, error: null }),
    ),
    on(FriendsActions.requestSent, (state, { outcome }) => withSentRequest(state, outcome)),
    on(FriendsActions.requestReceived, (state, { request }) => withReceivedRequest(state, request)),
    on(FriendsActions.friendAdded, (state, { friend }) => withFriend(state, friend)),
    on(
      FriendsActions.requestRemoved,
      (state, { requestId }): FriendsState => ({
        ...withoutRequest(state, requestId),
        searchResults: resetRelation(state.searchResults, requestId),
        busy: false,
      }),
    ),
    on(
      FriendsActions.friendRemoved,
      (state, { friendshipId }): FriendsState =>
        friendsAdapter.removeOne(friendshipId, {
          ...state,
          searchResults: resetRelation(state.searchResults, friendshipId),
          busy: false,
        }),
    ),
    on(FriendsActions.presenceChanged, (state, { userId, isOnline }) => {
      const friend = selectAll(state).find((candidate) => candidate.user.id === userId);
      if (!friend) {
        return state;
      }
      return friendsAdapter.updateOne({ id: friend.friendshipId, changes: { isOnline } }, state);
    }),
    on(
      FriendsActions.failed,
      (state, { error }): FriendsState => ({
        ...state,
        loading: false,
        searching: false,
        busy: false,
        error,
      }),
    ),
  ),
  extraSelectors: ({ selectFriendsState, selectIncoming }) => {
    const selectAllFriends = createSelector(selectFriendsState, selectAll);
    return {
      selectAllFriends,
      selectFriendEntities: createSelector(selectFriendsState, selectEntities),
      selectOnlineFriends: createSelector(selectAllFriends, (friends) =>
        friends.filter((friend) => friend.isOnline),
      ),
      selectIncomingCount: createSelector(selectIncoming, (incoming) => incoming.length),
    };
  },
});

function withSentRequest(state: FriendsState, outcome: FriendRequestOutcome): FriendsState {
  if (outcome.friend) {
    return withFriend(state, outcome.friend);
  }
  if (!outcome.request) {
    return { ...state, busy: false };
  }
  const request = outcome.request;
  return {
    ...state,
    outgoing: addRequest(state.outgoing, request),
    searchResults: setRelation(state.searchResults, request.user.id, 'REQUEST_SENT', request.id),
    busy: false,
  };
}

function withReceivedRequest(state: FriendsState, request: FriendRequest): FriendsState {
  return {
    ...state,
    incoming: addRequest(state.incoming, request),
    searchResults: setRelation(
      state.searchResults,
      request.user.id,
      'REQUEST_RECEIVED',
      request.id,
    ),
  };
}

// A friendship keeps the id of the request it came from, so accepting removes that request.
function withFriend(state: FriendsState, friend: Friend): FriendsState {
  const withoutAcceptedRequest = withoutRequest(state, friend.friendshipId);
  return friendsAdapter.upsertOne(friend, {
    ...withoutAcceptedRequest,
    searchResults: setRelation(state.searchResults, friend.user.id, 'FRIEND', friend.friendshipId),
    busy: false,
  });
}

// The socket event can arrive while the request list is still loading, so a request is kept once.
function addRequest(requests: FriendRequest[], request: FriendRequest): FriendRequest[] {
  return [...requests.filter((existing) => existing.id !== request.id), request];
}

function withoutRequest(state: FriendsState, requestId: string): FriendsState {
  return {
    ...state,
    incoming: state.incoming.filter((request) => request.id !== requestId),
    outgoing: state.outgoing.filter((request) => request.id !== requestId),
  };
}

function setRelation(
  results: UserSearchResult[],
  userId: string,
  relation: FriendRelation,
  friendshipId: string,
): UserSearchResult[] {
  return results.map(
    (result): UserSearchResult =>
      result.user.id === userId ? { ...result, relation, friendshipId } : result,
  );
}

function resetRelation(results: UserSearchResult[], friendshipId: string): UserSearchResult[] {
  return results.map(
    (result): UserSearchResult =>
      result.friendshipId === friendshipId
        ? { ...result, relation: 'NONE', friendshipId: null }
        : result,
  );
}

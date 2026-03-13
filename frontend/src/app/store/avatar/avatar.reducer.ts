import { createReducer, on } from '@ngrx/store';
import { AvatarActions } from './avatar.actions';
import { initialAvatarState, avatarAdapter } from './avatar.state';

export const avatarReducer = createReducer(
  initialAvatarState,

  on(AvatarActions.loadItems, (state) => ({ ...state, loading: true, error: null })),
  on(AvatarActions.loadItemsSuccess, (state, { items }) =>
    avatarAdapter.setAll(items, { ...state, loading: false }),
  ),
  on(AvatarActions.loadItemsFailure, (state, { error }) => ({ ...state, loading: false, error })),

  on(AvatarActions.loadEquippedSuccess, (state, { equipped }) => ({ ...state, equipped })),

  on(AvatarActions.selectAvatar, (state) => ({ ...state, loading: true })),
  on(AvatarActions.selectAvatarSuccess, (state, { equipped }) => ({ ...state, equipped, loading: false })),
  on(AvatarActions.selectAvatarFailure, (state, { error }) => ({ ...state, loading: false, error })),

  on(AvatarActions.loadStartersSuccess, (state, { starters }) => ({ ...state, starters })),

  on(AvatarActions.selectStarter, (state) => ({ ...state, loading: true })),
  on(AvatarActions.selectStarterSuccess, (state, { userItem }) => ({
    ...state,
    equipped: userItem,
    loading: false,
  })),
  on(AvatarActions.selectStarterFailure, (state, { error }) => ({ ...state, loading: false, error })),

  on(AvatarActions.clearError, (state) => ({ ...state, error: null })),
);

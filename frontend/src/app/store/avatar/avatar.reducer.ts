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

  on(AvatarActions.loadPets, (state) => ({ ...state, loading: true, error: null })),
  on(AvatarActions.loadPetsSuccess, (state, { pets }) => ({ ...state, pets, loading: false })),
  on(AvatarActions.loadPetsFailure, (state, { error }) => ({ ...state, loading: false, error })),

  on(AvatarActions.selectPet, (state) => ({ ...state, loading: true })),
  on(AvatarActions.selectPetSuccess, (state, { equipped }) => ({ ...state, equippedPet: equipped, loading: false })),
  on(AvatarActions.selectPetFailure, (state, { error }) => ({ ...state, loading: false, error })),

  on(AvatarActions.unequipPet, (state) => ({ ...state, loading: true })),
  on(AvatarActions.unequipPetSuccess, (state) => ({ ...state, equippedPet: null, loading: false })),
  on(AvatarActions.unequipPetFailure, (state, { error }) => ({ ...state, loading: false, error })),
);

import { createFeatureSelector, createSelector } from '@ngrx/store';
import { AvatarState, avatarAdapter } from './avatar.state';

export const selectAvatarState = createFeatureSelector<AvatarState>('avatar');

const { selectAll } = avatarAdapter.getSelectors(selectAvatarState);

export const selectAllUserItems = selectAll;
export const selectEquippedAvatar = createSelector(selectAvatarState, (s) => s.equipped);
export const selectAvatarStarters = createSelector(selectAvatarState, (s) => s.starters);
export const selectAvatarLoading = createSelector(selectAvatarState, (s) => s.loading);
export const selectAvatarError = createSelector(selectAvatarState, (s) => s.error);
export const selectUserPets = createSelector(selectAvatarState, (s) => s.pets);
export const selectEquippedPet = createSelector(selectAvatarState, (s) => s.equippedPet);

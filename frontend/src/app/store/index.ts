import { AppStatusState } from './app-status/app-status.state';

export interface AppState {
  appStatus: AppStatusState;
}

export * from './app-status';

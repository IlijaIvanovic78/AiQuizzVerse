export type ApiStatus = 'idle' | 'loading' | 'ok' | 'error';

export interface AppStatusState {
  apiStatus: ApiStatus;
  serverTime?: string;
  error?: string;
}

export const initialAppStatusState: AppStatusState = {
  apiStatus: 'idle',
  serverTime: undefined,
  error: undefined,
};

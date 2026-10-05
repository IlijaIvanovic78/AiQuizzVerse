export const OFFLINE_GRACE_MS = 3_000;
export const DEFAULT_FRONTEND_URL = 'http://localhost:4200';

export function userRoom(userId: string): string {
  return `user:${userId}`;
}

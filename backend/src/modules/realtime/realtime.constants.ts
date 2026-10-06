export const OFFLINE_GRACE_MS = 3_000;
/** The frontend refreshes its token and reconnects when a socket is refused with this message. */
export const UNAUTHORIZED_SOCKET_ERROR = 'unauthorized';

export function userRoom(userId: string): string {
  return `user:${userId}`;
}

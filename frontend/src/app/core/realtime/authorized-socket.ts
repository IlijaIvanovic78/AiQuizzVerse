import { Socket, io } from 'socket.io-client';
import { TokenRefreshService } from '../auth/token-refresh.service';
import { TokenStorageService } from '../auth/token-storage.service';
import { SOCKET_PATH, UNAUTHORIZED_ERROR } from './realtime.constants';

export function createAuthorizedSocket(
  namespace: string,
  tokens: TokenStorageService,
  tokenRefresh: TokenRefreshService,
): Socket {
  const socket = io(namespace, {
    path: SOCKET_PATH,
    transports: ['websocket'],
    autoConnect: false,
    auth: (sendAuth) => sendAuth({ token: tokens.accessToken() }),
  });

  // The server rejects an expired access token; refresh it once and try again.
  let refreshTried = false;
  socket.on('connect', () => (refreshTried = false));
  socket.on('connect_error', (error) => {
    if (error.message !== UNAUTHORIZED_ERROR || refreshTried) {
      return;
    }
    refreshTried = true;
    tokenRefresh.refresh().subscribe({
      next: () => socket.connect(),
      error: () => socket.disconnect(),
    });
  });

  return socket;
}

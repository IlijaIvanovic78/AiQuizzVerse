import { Injectable } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { TokenPayload } from '../auth/auth.types';
import { UNAUTHORIZED_SOCKET_ERROR } from './realtime.constants';
import { UnauthenticatedSocket } from './realtime.types';

@Injectable()
export class WsAuthService {
  constructor(private readonly jwt: JwtService) {}

  /**
   * Socket.IO middleware that lets a socket connect only with a valid access token.
   * It is an arrow function so it keeps `this` when a gateway passes it to server.use().
   */
  readonly middleware = (socket: UnauthenticatedSocket, next: (error?: Error) => void): void => {
    this.authenticate(socket).then(
      () => next(),
      () => next(new Error(UNAUTHORIZED_SOCKET_ERROR)),
    );
  };

  /** Fails for a missing, expired or non-access token and otherwise stores the user id. */
  private async authenticate(socket: UnauthenticatedSocket): Promise<void> {
    const token: unknown = socket.handshake.auth.token;
    if (typeof token !== 'string') {
      throw new Error('Missing access token');
    }

    const payload = await this.jwt.verifyAsync<TokenPayload>(token);
    if (payload.type !== 'access') {
      throw new Error('Wrong token type');
    }
    socket.data.userId = payload.sub;
  }
}

import { Injectable } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { WsException } from '@nestjs/websockets';
import { TokenPayload } from '../auth/auth.types';
import { UnauthenticatedSocket } from './realtime.types';

@Injectable()
export class WsAuthService {
  constructor(private readonly jwt: JwtService) {}

  async authenticate(socket: UnauthenticatedSocket): Promise<void> {
    const token: unknown = socket.handshake.auth.token;
    if (typeof token !== 'string') {
      throw new WsException('Missing access token');
    }

    const payload = await this.jwt.verifyAsync<TokenPayload>(token);
    if (payload.type !== 'access') {
      throw new WsException('Wrong token type');
    }
    socket.data.userId = payload.sub;
  }
}

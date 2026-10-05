import { Injectable, UnauthorizedException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { PassportStrategy } from '@nestjs/passport';
import { Request } from 'express';
import { ExtractJwt, Strategy } from 'passport-jwt';
import { SESSION_EXPIRED_MESSAGE } from '../auth.constants';
import { AuthService } from '../auth.service';
import { AuthUser, TokenPayload } from '../auth.types';

@Injectable()
export class JwtRefreshStrategy extends PassportStrategy(Strategy, 'jwt-refresh') {
  constructor(
    config: ConfigService,
    private readonly auth: AuthService,
  ) {
    super({
      jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken(),
      secretOrKey: config.getOrThrow<string>('JWT_REFRESH_SECRET'),
      passReqToCallback: true,
    });
  }

  async validate(request: Request, payload: TokenPayload): Promise<AuthUser> {
    const refreshToken = ExtractJwt.fromAuthHeaderAsBearerToken()(request);
    if (payload.type !== 'refresh' || !refreshToken) {
      throw new UnauthorizedException(SESSION_EXPIRED_MESSAGE);
    }
    await this.auth.assertRefreshTokenIsCurrent(payload.sub, refreshToken);
    return { userId: payload.sub };
  }
}

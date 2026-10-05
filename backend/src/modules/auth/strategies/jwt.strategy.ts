import { Injectable, UnauthorizedException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { PassportStrategy } from '@nestjs/passport';
import { ExtractJwt, Strategy } from 'passport-jwt';
import { SESSION_EXPIRED_MESSAGE } from '../auth.constants';
import { AuthUser, TokenPayload } from '../auth.types';

@Injectable()
export class JwtStrategy extends PassportStrategy(Strategy, 'jwt') {
  constructor(config: ConfigService) {
    super({
      jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken(),
      secretOrKey: config.getOrThrow<string>('JWT_ACCESS_SECRET'),
    });
  }

  validate(payload: TokenPayload): AuthUser {
    if (payload.type !== 'access') {
      throw new UnauthorizedException(SESSION_EXPIRED_MESSAGE);
    }
    return { userId: payload.sub };
  }
}

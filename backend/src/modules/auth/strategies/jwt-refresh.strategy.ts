import { Injectable, UnauthorizedException } from '@nestjs/common';
import { PassportStrategy } from '@nestjs/passport';
import { ExtractJwt, Strategy } from 'passport-jwt';
import { Request } from 'express';

export interface JwtRefreshPayload {
  sub: string;
  email: string;
  iat?: number;
  exp?: number;
}

@Injectable()
export class JwtRefreshStrategy extends PassportStrategy(Strategy, 'jwt-refresh') {
  constructor() {
    super({
      jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken(),
      ignoreExpiration: false,
      secretOrKey: process.env.JWT_REFRESH_SECRET!,
      passReqToCallback: true,
    } as any);
  }

  async validate(req: Request, payload: JwtRefreshPayload) {
    if (!payload.sub || !payload.email) {
      throw new UnauthorizedException('Invalid refresh token payload');
    }

    // Extract refresh token from Authorization header
    const authHeader = req.headers.authorization;
    const refreshToken = authHeader?.replace('Bearer ', '').trim();

    if (!refreshToken) {
      throw new UnauthorizedException('Refresh token not found');
    }

    return {
      userId: payload.sub,
      email: payload.email,
      refreshToken,
    };
  }
}

import { Injectable, UnauthorizedException } from '@nestjs/common';
import { PassportStrategy } from '@nestjs/passport';
import { Strategy } from 'passport-local';
import { normalizeEmail } from '../../../common/utils/text.transforms';
import { WRONG_CREDENTIALS_MESSAGE } from '../auth.constants';
import { AuthService } from '../auth.service';
import { AuthUser } from '../auth.types';

@Injectable()
export class LocalStrategy extends PassportStrategy(Strategy, 'local') {
  constructor(private readonly auth: AuthService) {
    super({ usernameField: 'email' });
  }

  // The guard runs before the ValidationPipe, so the raw JSON body may hold any type here.
  validate(email: unknown, password: unknown): Promise<AuthUser> {
    if (typeof email !== 'string' || typeof password !== 'string') {
      throw new UnauthorizedException(WRONG_CREDENTIALS_MESSAGE);
    }
    return this.auth.validateCredentials(normalizeEmail(email), password);
  }
}

import { ConflictException, Injectable, UnauthorizedException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { JwtService, JwtSignOptions } from '@nestjs/jwt';
import { compare, hash } from 'bcrypt';
import { createHash, randomUUID, timingSafeEqual } from 'crypto';
import { QuizzesService } from '../quizzes/quizzes.service';
import { USERNAME_PATTERN, USERNAME_TAKEN_MESSAGE } from '../users/users.constants';
import { UsersService } from '../users/users.service';
import {
  BCRYPT_ROUNDS,
  SESSION_EXPIRED_MESSAGE,
  TWO_FACTOR_TOKEN_EXPIRATION,
  WRONG_CODE_MESSAGE,
  WRONG_CREDENTIALS_MESSAGE,
} from './auth.constants';
import {
  AccessTokenPayload,
  AuthResponse,
  AuthUser,
  LoginResult,
  RefreshTokenPayload,
  TokenPayload,
  TwoFactorTokenPayload,
} from './auth.types';
import { RegisterDto } from './dto/register.dto';
import { TwoFactorService } from './two-factor.service';

@Injectable()
export class AuthService {
  constructor(
    private readonly users: UsersService,
    private readonly quizzes: QuizzesService,
    private readonly twoFactor: TwoFactorService,
    private readonly jwt: JwtService,
    private readonly config: ConfigService,
  ) {}

  async register(dto: RegisterDto): Promise<AuthResponse> {
    await this.assertCanRegister(dto.email, dto.username);
    const passwordHash = await hash(dto.password, BCRYPT_ROUNDS);
    const user = await this.users.create({
      email: dto.email,
      username: dto.username,
      passwordHash,
    });
    await this.quizzes.copyStarterQuizzes(user.id);
    return this.createSession(user.id);
  }

  async validateCredentials(email: string, password: string): Promise<AuthUser> {
    const user = await this.users.findByEmail(email);
    if (!user || !(await compare(password, user.passwordHash))) {
      throw new UnauthorizedException(WRONG_CREDENTIALS_MESSAGE);
    }
    return { userId: user.id };
  }

  async login(userId: string): Promise<LoginResult> {
    const user = await this.users.findByIdOrThrow(userId);
    if (user.twoFaEnabled) {
      return { twoFactorRequired: true, twoFactorToken: await this.signTwoFactorToken(userId) };
    }
    return this.createSession(userId);
  }

  async loginWithTwoFactor(twoFactorToken: string, code: string): Promise<AuthResponse> {
    const userId = await this.verifyTwoFactorToken(twoFactorToken);
    if (!(await this.twoFactor.isValidLoginCode(userId, code))) {
      throw new UnauthorizedException(WRONG_CODE_MESSAGE);
    }
    return this.createSession(userId);
  }

  async assertRefreshTokenIsCurrent(userId: string, refreshToken: string): Promise<void> {
    const user = await this.users.findById(userId);
    if (!user?.refreshTokenHash || !sameHash(sha256(refreshToken), user.refreshTokenHash)) {
      throw new UnauthorizedException(SESSION_EXPIRED_MESSAGE);
    }
  }

  refresh(userId: string): Promise<AuthResponse> {
    return this.createSession(userId);
  }

  async logout(userId: string): Promise<void> {
    await this.users.setRefreshTokenHash(userId, null);
  }

  async isUsernameAvailable(username: string): Promise<boolean> {
    if (!USERNAME_PATTERN.test(username)) {
      return false;
    }
    return !(await this.users.isUsernameTaken(username));
  }

  private async assertCanRegister(email: string, username: string): Promise<void> {
    if (await this.users.findByEmail(email)) {
      throw new ConflictException('An account with this email already exists.');
    }
    if (await this.users.isUsernameTaken(username)) {
      throw new ConflictException(USERNAME_TAKEN_MESSAGE);
    }
  }

  private async createSession(userId: string): Promise<AuthResponse> {
    const accessToken = await this.signAccessToken(userId);
    const refreshToken = await this.signRefreshToken(userId);
    await this.users.setRefreshTokenHash(userId, sha256(refreshToken));
    const user = await this.users.findCurrentUser(userId);
    return { user, accessToken, refreshToken };
  }

  private signAccessToken(userId: string): Promise<string> {
    const payload: AccessTokenPayload = { sub: userId, type: 'access' };
    return this.jwt.signAsync(payload);
  }

  private signRefreshToken(userId: string): Promise<string> {
    const payload: RefreshTokenPayload = { sub: userId, type: 'refresh', jti: randomUUID() };
    return this.jwt.signAsync(payload, {
      secret: this.config.getOrThrow<string>('JWT_REFRESH_SECRET'),
      expiresIn: this.config.getOrThrow<JwtSignOptions['expiresIn']>('JWT_REFRESH_EXPIRATION'),
    });
  }

  private signTwoFactorToken(userId: string): Promise<string> {
    const payload: TwoFactorTokenPayload = { sub: userId, type: '2fa' };
    return this.jwt.signAsync(payload, { expiresIn: TWO_FACTOR_TOKEN_EXPIRATION });
  }

  private async verifyTwoFactorToken(token: string): Promise<string> {
    const payload = await this.jwt.verifyAsync<TokenPayload>(token).catch(() => null);
    if (payload?.type !== '2fa') {
      throw new UnauthorizedException('Your login took too long. Please log in again.');
    }
    return payload.sub;
  }
}

function sha256(value: string): string {
  return createHash('sha256').update(value).digest('hex');
}

function sameHash(first: string, second: string): boolean {
  const a = Buffer.from(first, 'hex');
  const b = Buffer.from(second, 'hex');
  return a.length === b.length && timingSafeEqual(a, b);
}

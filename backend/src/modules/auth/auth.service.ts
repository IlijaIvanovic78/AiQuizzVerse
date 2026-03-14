import {
  Injectable,
  UnauthorizedException,
  BadRequestException,
  ConflictException,
} from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { UsersService } from '../users/users.service';
import { RegisterDto, LoginDto } from './dto';
import * as bcrypt from 'bcrypt';
import * as speakeasy from 'speakeasy';
import * as qrcode from 'qrcode';
import { User } from '@prisma/client';
import { BCRYPT_SALT_ROUNDS } from '../../core/constants/app.constants';

export interface Tokens {
  accessToken: string;
  refreshToken: string;
}

export interface AuthResponse {
  user: Omit<User, 'passwordHash' | 'refreshToken' | 'twoFaSecret'>;
  accessToken: string;
  refreshToken: string;
}

@Injectable()
export class AuthService {
  constructor(
    private readonly usersService: UsersService,
    private readonly jwtService: JwtService,
  ) {}

  // ==================== REGISTRATION ====================
  async register(registerDto: RegisterDto): Promise<AuthResponse> {
    // Check if email already exists
    const existingEmail = await this.usersService.findByEmail(registerDto.email);
    if (existingEmail) {
      throw new ConflictException('Email already in use');
    }

    // Check if username already exists
    const existingUsername = await this.usersService.findByUsername(registerDto.username);
    if (existingUsername) {
      throw new ConflictException('Username already taken');
    }

    // Hash password with bcrypt (10 rounds)
    const passwordHash = await this.hashData(registerDto.password);

    // Create user
    const user = await this.usersService.create({
      email: registerDto.email,
      username: registerDto.username,
      passwordHash,
    });

    // Generate tokens and auto-login
    const tokens = await this.getTokens(user.id, user.email);
    await this.updateRefreshToken(user.id, tokens.refreshToken);

    return {
      user: this.sanitizeUser(user),
      ...tokens,
    };
  }

  // ==================== LOGIN ====================
  async login(
    loginDto: LoginDto,
  ): Promise<AuthResponse | { is2FARequired: true; userId: string }> {
    // Validate user credentials
    const user = await this.validateUser(loginDto.email, loginDto.password);

    if (!user) {
      throw new UnauthorizedException('Invalid credentials');
    }

    // Check if 2FA is enabled
    if (user.twoFaEnabled) {
      return {
        is2FARequired: true,
        userId: user.id,
      };
    }

    // Generate tokens
    const tokens = await this.getTokens(user.id, user.email);

    // Save hashed refresh token to database
    await this.updateRefreshToken(user.id, tokens.refreshToken);

    return {
      user: this.sanitizeUser(user),
      ...tokens,
    };
  }

  // ==================== 2FA LOGIN ====================
  async login2FA(userId: string, token: string): Promise<AuthResponse> {
    // Validate 2FA token
    const isValid = await this.validate2FAToken(userId, token);

    if (!isValid) {
      throw new UnauthorizedException('Invalid 2FA code');
    }

    const user = await this.usersService.findOne(userId);
    if (!user) {
      throw new UnauthorizedException('User not found');
    }

    // Generate tokens
    const tokens = await this.getTokens(user.id, user.email);

    // Save hashed refresh token
    await this.updateRefreshToken(user.id, tokens.refreshToken);

    return {
      user: this.sanitizeUser(user),
      ...tokens,
    };
  }

  // ==================== VALIDATE USER ====================
  async validateUser(email: string, password: string): Promise<User | null> {
    const user = await this.usersService.findByEmail(email);

    if (!user) {
      return null;
    }

    // Compare password with bcrypt
    const isPasswordValid = await bcrypt.compare(password, user.passwordHash);

    if (!isPasswordValid) {
      return null;
    }

    return user;
  }

  // ==================== REFRESH TOKENS ====================
  async refreshTokens(userId: string, refreshToken: string): Promise<AuthResponse> {
    const user = await this.usersService.findOne(userId);

    if (!user || !user.refreshToken) {
      throw new UnauthorizedException('Access denied');
    }

    // Verify refresh token matches the one in database
    const refreshTokenMatches = await bcrypt.compare(
      refreshToken,
      user.refreshToken,
    );

    if (!refreshTokenMatches) {
      throw new UnauthorizedException('Invalid refresh token');
    }

    // Generate new tokens
    const tokens = await this.getTokens(user.id, user.email);

    // Update refresh token in database
    await this.updateRefreshToken(user.id, tokens.refreshToken);

    return {
      user: this.sanitizeUser(user),
      ...tokens,
    };
  }

  // ==================== LOGOUT ====================
  async logout(userId: string): Promise<{ message: string }> {
    // Clear refresh token from database
    await this.usersService.updateRefreshToken(userId, null);

    return { message: 'Logged out successfully' };
  }

  // ==================== 2FA ENABLE ====================
  async enable2FA(userId: string): Promise<{ secret: string; qrCode: string }> {
    const user = await this.usersService.findOne(userId);

    if (!user) {
      throw new BadRequestException('User not found');
    }

    if (user.twoFaEnabled) {
      throw new BadRequestException('2FA is already enabled');
    }

    // Generate 2FA secret
    const secret = speakeasy.generateSecret({
      name: `AI QuizVerse (${user.email})`,
      issuer: 'AI QuizVerse',
    });

    // Save secret to database
    await this.usersService.update2FASecret(userId, secret.base32);

    // Generate QR code
    const qrCode = await this.generate2FAQrCode(secret.otpauth_url!);

    return {
      secret: secret.base32,
      qrCode,
    };
  }

  // ==================== 2FA VERIFY ====================
  async verify2FA(userId: string, token: string): Promise<{ message: string }> {
    const isValid = await this.validate2FAToken(userId, token);

    if (!isValid) {
      throw new BadRequestException('Invalid 2FA code');
    }

    // Enable 2FA for user
    await this.usersService.enable2FA(userId);

    return { message: '2FA enabled successfully' };
  }

  // ==================== 2FA DISABLE ====================
  async disable2FA(userId: string): Promise<{ message: string }> {
    const user = await this.usersService.findOne(userId);

    if (!user) {
      throw new BadRequestException('User not found');
    }

    if (!user.twoFaEnabled) {
      throw new BadRequestException('2FA is not enabled');
    }

    await this.usersService.disable2FA(userId);

    return { message: '2FA disabled successfully' };
  }

  // ==================== 2FA VALIDATE TOKEN ====================
  async validate2FAToken(userId: string, token: string): Promise<boolean> {
    const user = await this.usersService.findOne(userId);

    if (!user || !user.twoFaSecret) {
      return false;
    }

    // Verify TOTP token
    const isValid = speakeasy.totp.verify({
      secret: user.twoFaSecret,
      encoding: 'base32',
      token,
      window: 2, // Allow 2 time steps before/after (60 seconds buffer)
    });

    return isValid;
  }

  // ==================== HELPER: GENERATE TOKENS ====================
  private async getTokens(userId: string, email: string): Promise<Tokens> {
    const payload = { sub: userId, email };
    
    const [accessToken, refreshToken] = await Promise.all([
      this.jwtService.signAsync(payload, {
        secret: process.env.JWT_ACCESS_SECRET!,
        expiresIn: process.env.JWT_ACCESS_EXPIRATION || '15m',
      } as any),
      this.jwtService.signAsync(payload, {
        secret: process.env.JWT_REFRESH_SECRET!,
        expiresIn: process.env.JWT_REFRESH_EXPIRATION || '7d',
      } as any),
    ]);

    return {
      accessToken,
      refreshToken,
    };
  }

  // ==================== HELPER: HASH DATA ====================
  private async hashData(data: string): Promise<string> {
    return bcrypt.hash(data, BCRYPT_SALT_ROUNDS);
  }

  // ==================== HELPER: UPDATE REFRESH TOKEN ====================
  private async updateRefreshToken(
    userId: string,
    refreshToken: string,
  ): Promise<void> {
    const hashedRefreshToken = await this.hashData(refreshToken);
    await this.usersService.updateRefreshToken(userId, hashedRefreshToken);
  }

  // ==================== HELPER: SANITIZE USER ====================
  private sanitizeUser(user: User): Omit<User, 'passwordHash' | 'refreshToken' | 'twoFaSecret'> {
    const { passwordHash, refreshToken, twoFaSecret, ...safeUser } = user;
    return safeUser;
  }

  // ==================== HELPER: GENERATE QR CODE ====================
  private async generate2FAQrCode(otpAuthUrl: string): Promise<string> {
    try {
      const qrCodeDataUrl = await qrcode.toDataURL(otpAuthUrl);
      return qrCodeDataUrl;
    } catch (error) {
      throw new BadRequestException('Failed to generate QR code');
    }
  }
}

import { BadRequestException, Injectable } from '@nestjs/common';
import { toDataURL } from 'qrcode';
import * as speakeasy from 'speakeasy';
import { UsersService } from '../users/users.service';
import { CurrentUser } from '../users/users.types';
import { TOTP_ISSUER, TOTP_WINDOW } from './auth.constants';
import { TwoFactorSetup } from './auth.types';

@Injectable()
export class TwoFactorService {
  constructor(private readonly users: UsersService) {}

  async setup(userId: string): Promise<TwoFactorSetup> {
    const user = await this.users.findByIdOrThrow(userId);
    if (user.twoFaEnabled) {
      throw new BadRequestException('Two-step login is already on.');
    }

    const secret = speakeasy.generateSecret().base32;
    await this.users.setTwoFaSecret(userId, secret);
    const url = speakeasy.otpauthURL({
      secret,
      encoding: 'base32',
      label: user.username,
      issuer: TOTP_ISSUER,
    });
    return { secret, qrCodeDataUrl: await toDataURL(url) };
  }

  async enable(userId: string, code: string): Promise<CurrentUser> {
    const user = await this.users.findByIdOrThrow(userId);
    if (user.twoFaEnabled) {
      throw new BadRequestException('Two-step login is already on.');
    }
    if (!user.twoFaSecret) {
      throw new BadRequestException('Scan the QR code first.');
    }

    this.assertValidCode(user.twoFaSecret, code);
    await this.users.enableTwoFa(userId);
    return this.users.findCurrentUser(userId);
  }

  async disable(userId: string, code: string): Promise<CurrentUser> {
    const user = await this.users.findByIdOrThrow(userId);
    if (!user.twoFaEnabled || !user.twoFaSecret) {
      throw new BadRequestException('Two-step login is not on.');
    }

    this.assertValidCode(user.twoFaSecret, code);
    await this.users.disableTwoFa(userId);
    return this.users.findCurrentUser(userId);
  }

  async isValidLoginCode(userId: string, code: string): Promise<boolean> {
    const user = await this.users.findById(userId);
    if (!user?.twoFaEnabled || !user.twoFaSecret) {
      return false;
    }
    return this.isValidCode(user.twoFaSecret, code);
  }

  private assertValidCode(secret: string, code: string): void {
    if (!this.isValidCode(secret, code)) {
      throw new BadRequestException('That code did not work. Try the newest code from your app.');
    }
  }

  private isValidCode(secret: string, code: string): boolean {
    return speakeasy.totp.verify({ secret, encoding: 'base32', token: code, window: TOTP_WINDOW });
  }
}

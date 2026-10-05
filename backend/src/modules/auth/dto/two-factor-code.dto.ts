import { ApiProperty } from '@nestjs/swagger';
import { Matches } from 'class-validator';
import { TOTP_CODE_PATTERN } from '../auth.constants';

export class TwoFactorCodeDto {
  @ApiProperty({ example: '123456', description: '6-digit code from the authenticator app' })
  @Matches(TOTP_CODE_PATTERN, { message: 'The code has 6 digits.' })
  code: string;
}

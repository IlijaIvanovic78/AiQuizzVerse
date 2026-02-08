import { IsString, Length, Matches } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class TwoFactorDto {
  @ApiProperty({ example: '123456', description: '6-digit TOTP code from authenticator app' })
  @IsString()
  @Length(6, 6, { message: '2FA code must be exactly 6 digits' })
  @Matches(/^\d{6}$/, { message: '2FA code must contain only numbers' })
  token: string;
}

export class Login2FADto extends TwoFactorDto {
  @ApiProperty({ example: 'uuid-of-user', description: 'User ID received from login response' })
  @IsString()
  userId: string;
}

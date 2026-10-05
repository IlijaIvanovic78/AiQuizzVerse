import { ApiProperty } from '@nestjs/swagger';
import { IsNotEmpty, IsString } from 'class-validator';
import { TwoFactorCodeDto } from './two-factor-code.dto';

export class TwoFactorLoginDto extends TwoFactorCodeDto {
  @ApiProperty({ description: 'twoFactorToken from the login response' })
  @IsString()
  @IsNotEmpty()
  twoFactorToken: string;
}

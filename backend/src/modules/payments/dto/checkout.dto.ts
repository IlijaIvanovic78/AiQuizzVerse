import { ApiProperty } from '@nestjs/swagger';
import { IsIn } from 'class-validator';
import { COIN_PACKAGE_IDS } from '../coin-packages';

export class CheckoutDto {
  @ApiProperty({ enum: COIN_PACKAGE_IDS, example: 'pouch' })
  @IsIn(COIN_PACKAGE_IDS, { message: 'Pick one of the coin packs.' })
  packageId: string;
}

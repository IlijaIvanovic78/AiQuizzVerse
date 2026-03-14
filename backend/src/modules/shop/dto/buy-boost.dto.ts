import { IsEnum, IsNotEmpty } from 'class-validator';
import { BoostType } from '@prisma/client';

export class BuyBoostDto {
  @IsNotEmpty()
  @IsEnum(BoostType)
  type: BoostType;
}

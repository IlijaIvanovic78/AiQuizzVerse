import { IsIn, IsUUID } from 'class-validator';
import { SABOTAGE_TYPES } from '../matches.constants';
import type { SabotageType } from '../matches.types';
import { MatchIdDto } from './match-id.dto';

export class SabotageDto extends MatchIdDto {
  @IsUUID('all', { message: 'Pick a player to sabotage.' })
  targetUserId: string;

  @IsIn(SABOTAGE_TYPES, { message: 'Pick INK, FREEZE or SCRAMBLE.' })
  type: SabotageType;
}

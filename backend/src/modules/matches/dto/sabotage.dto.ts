import { IsIn, IsUUID, ValidateIf } from 'class-validator';
import { SABOTAGE_TYPES } from '../matches.constants';
import type { SabotageType } from '../matches.types';
import { MatchIdDto } from './match-id.dto';

export class SabotageDto extends MatchIdDto {
  /** Not needed for SHIELD, which always protects the player who raises it. */
  @ValidateIf((dto: SabotageDto) => dto.type !== 'SHIELD')
  @IsUUID('all', { message: 'Pick a player to sabotage.' })
  targetUserId?: string;

  @IsIn(SABOTAGE_TYPES, { message: 'Pick a sabotage from your sabotage bar.' })
  type: SabotageType;
}

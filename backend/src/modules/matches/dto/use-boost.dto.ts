import { IsIn } from 'class-validator';
import { MATCH_BOOST_TYPES } from '../matches.constants';
import type { MatchBoostType } from '../matches.types';
import { MatchIdDto } from './match-id.dto';

export class UseBoostDto extends MatchIdDto {
  @IsIn(MATCH_BOOST_TYPES, { message: 'This power-up does not work in a match.' })
  type: MatchBoostType;
}

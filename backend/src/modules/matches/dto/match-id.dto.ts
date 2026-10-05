import { IsUUID } from 'class-validator';

export class MatchIdDto {
  @IsUUID()
  matchId: string;
}

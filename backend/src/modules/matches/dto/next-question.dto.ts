import { IsInt, Min } from 'class-validator';
import { MatchIdDto } from './match-id.dto';

export class NextQuestionDto extends MatchIdDto {
  @IsInt()
  @Min(0)
  questionIndex: number;
}

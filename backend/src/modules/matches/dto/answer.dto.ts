import { IsInt, Max, Min } from 'class-validator';
import { OPTIONS_PER_QUESTION } from '../../../common/quiz-shape.constants';
import { MatchIdDto } from './match-id.dto';

export class AnswerDto extends MatchIdDto {
  @IsInt()
  @Min(0)
  questionIndex: number;

  @IsInt()
  @Min(0)
  @Max(OPTIONS_PER_QUESTION - 1)
  optionIndex: number;
}

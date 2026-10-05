import { ApiProperty } from '@nestjs/swagger';
import { Transform } from 'class-transformer';
import {
  ArrayMaxSize,
  ArrayMinSize,
  ArrayUnique,
  IsArray,
  IsInt,
  IsString,
  Length,
  Max,
  Min,
} from 'class-validator';
import { OPTIONS_PER_QUESTION } from '../../../common/quiz-shape.constants';
import { trimEachText, trimText } from '../../../common/utils/text.transforms';
import {
  EXPLANATION_MAX_LENGTH,
  HINT_MAX_LENGTH,
  OPTION_MAX_LENGTH,
  QUESTION_MAX_LENGTH,
  QUESTION_MIN_LENGTH,
} from '../quizzes.constants';

const OPTION_COUNT_MESSAGE = `Every question needs exactly ${OPTIONS_PER_QUESTION} options.`;

function ignoreCase(option: unknown): unknown {
  return typeof option === 'string' ? option.toLowerCase() : option;
}

export class QuestionInputDto {
  @ApiProperty({ example: 'Which planet is closest to the Sun?' })
  @Transform(trimText)
  @IsString()
  @Length(QUESTION_MIN_LENGTH, QUESTION_MAX_LENGTH)
  text: string;

  @ApiProperty({ type: [String], example: ['Mercury', 'Venus', 'Earth', 'Mars'] })
  @Transform(trimEachText)
  @IsArray()
  @ArrayMinSize(OPTIONS_PER_QUESTION, { message: OPTION_COUNT_MESSAGE })
  @ArrayMaxSize(OPTIONS_PER_QUESTION, { message: OPTION_COUNT_MESSAGE })
  @IsString({ each: true })
  @Length(1, OPTION_MAX_LENGTH, { each: true })
  @ArrayUnique(ignoreCase, {
    message: `The ${OPTIONS_PER_QUESTION} options must all be different.`,
  })
  options: string[];

  @ApiProperty({ minimum: 0, maximum: OPTIONS_PER_QUESTION - 1, example: 0 })
  @IsInt()
  @Min(0)
  @Max(OPTIONS_PER_QUESTION - 1)
  correctIndex: number;

  @ApiProperty({ example: 'Mercury is the closest planet to the Sun.' })
  @Transform(trimText)
  @IsString()
  @Length(1, EXPLANATION_MAX_LENGTH)
  explanation: string;

  @ApiProperty({ example: 'It is also the smallest planet.' })
  @Transform(trimText)
  @IsString()
  @Length(1, HINT_MAX_LENGTH)
  hint: string;
}

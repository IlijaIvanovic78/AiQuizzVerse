import { ApiPropertyOptional } from '@nestjs/swagger';
import { Transform } from 'class-transformer';
import { IsInt, IsOptional, IsString, Length, Max, Min } from 'class-validator';
import { trimText } from '../../../common/utils/text.transforms';
import {
  MAX_TIME_PER_QUESTION,
  MIN_TIME_PER_QUESTION,
  TITLE_MAX_LENGTH,
  TITLE_MIN_LENGTH,
} from '../quizzes.constants';

export class UpdateQuizDto {
  @ApiPropertyOptional({ example: 'Planets for Beginners' })
  @IsOptional()
  @Transform(trimText)
  @IsString()
  @Length(TITLE_MIN_LENGTH, TITLE_MAX_LENGTH)
  title?: string;

  @ApiPropertyOptional({ minimum: MIN_TIME_PER_QUESTION, maximum: MAX_TIME_PER_QUESTION })
  @IsOptional()
  @IsInt()
  @Min(MIN_TIME_PER_QUESTION)
  @Max(MAX_TIME_PER_QUESTION)
  timePerQuestion?: number;
}

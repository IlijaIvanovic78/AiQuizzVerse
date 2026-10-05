import { ApiPropertyOptional } from '@nestjs/swagger';
import { ArrayMaxSize, ArrayMinSize, IsArray, IsOptional, IsUUID } from 'class-validator';
import { MAX_QUESTIONS } from '../../quizzes/quizzes.constants';

export class PracticeDto {
  @ApiPropertyOptional({
    type: [String],
    description: 'Missed questions of one match. Without it, the cards due today are used.',
  })
  @IsOptional()
  @IsArray()
  @ArrayMinSize(1)
  // Accepts every miss of a match, but ReviewService practices at most MAX_PRACTICE_QUESTIONS.
  @ArrayMaxSize(MAX_QUESTIONS)
  @IsUUID('all', { each: true })
  questionIds?: string[];
}

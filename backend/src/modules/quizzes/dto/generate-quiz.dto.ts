import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { Audience, Difficulty, QuizLanguage } from '@prisma/client';
import { Transform } from 'class-transformer';
import { IsEnum, IsInt, IsOptional, IsString, IsUUID, Length, Max, Min } from 'class-validator';
import { trimText } from '../../../common/utils/text.transforms';
import {
  MAX_QUESTIONS,
  MAX_TIME_PER_QUESTION,
  MIN_QUESTIONS,
  MIN_TIME_PER_QUESTION,
  TOPIC_MAX_LENGTH,
  TOPIC_MIN_LENGTH,
} from '../quizzes.constants';

export class GenerateQuizDto {
  @ApiPropertyOptional({ example: 'Dinosaurs', description: 'Needed when there is no documentId' })
  @IsOptional()
  @Transform(trimText)
  @IsString()
  @Length(TOPIC_MIN_LENGTH, TOPIC_MAX_LENGTH)
  topic?: string;

  @ApiPropertyOptional({ format: 'uuid', description: 'An uploaded PDF lesson' })
  @IsOptional()
  @IsUUID()
  documentId?: string;

  @ApiProperty({ enum: Difficulty })
  @IsEnum(Difficulty)
  difficulty: Difficulty;

  @ApiProperty({ enum: Audience })
  @IsEnum(Audience)
  audience: Audience;

  @ApiProperty({ enum: QuizLanguage })
  @IsEnum(QuizLanguage)
  language: QuizLanguage;

  @ApiProperty({ minimum: MIN_QUESTIONS, maximum: MAX_QUESTIONS, example: 5 })
  @IsInt()
  @Min(MIN_QUESTIONS)
  @Max(MAX_QUESTIONS)
  questionCount: number;

  @ApiProperty({ minimum: MIN_TIME_PER_QUESTION, maximum: MAX_TIME_PER_QUESTION, example: 45 })
  @IsInt()
  @Min(MIN_TIME_PER_QUESTION)
  @Max(MAX_TIME_PER_QUESTION)
  timePerQuestion: number;
}

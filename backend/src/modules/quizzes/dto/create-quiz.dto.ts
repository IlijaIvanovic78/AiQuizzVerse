import { ApiProperty } from '@nestjs/swagger';
import { Audience, Difficulty, QuizLanguage, QuizTheme } from '@prisma/client';
import { Transform, Type } from 'class-transformer';
import {
  ArrayMaxSize,
  ArrayMinSize,
  IsArray,
  IsEnum,
  IsInt,
  IsString,
  Length,
  Max,
  Min,
  ValidateNested,
} from 'class-validator';
import { trimText } from '../../../common/utils/text.transforms';
import {
  MAX_QUESTIONS,
  MAX_TIME_PER_QUESTION,
  MIN_QUESTIONS,
  MIN_TIME_PER_QUESTION,
  TITLE_MAX_LENGTH,
  TITLE_MIN_LENGTH,
  TOPIC_MAX_LENGTH,
  TOPIC_MIN_LENGTH,
} from '../quizzes.constants';
import { QuestionInputDto } from './question-input.dto';

export class CreateQuizDto {
  @ApiProperty({ example: 'My Planets Quiz' })
  @Transform(trimText)
  @IsString()
  @Length(TITLE_MIN_LENGTH, TITLE_MAX_LENGTH)
  title: string;

  @ApiProperty({ example: 'The Solar System' })
  @Transform(trimText)
  @IsString()
  @Length(TOPIC_MIN_LENGTH, TOPIC_MAX_LENGTH)
  topic: string;

  @ApiProperty({ enum: QuizTheme })
  @IsEnum(QuizTheme)
  theme: QuizTheme;

  @ApiProperty({ enum: Difficulty })
  @IsEnum(Difficulty)
  difficulty: Difficulty;

  @ApiProperty({ enum: Audience })
  @IsEnum(Audience)
  audience: Audience;

  @ApiProperty({ enum: QuizLanguage })
  @IsEnum(QuizLanguage)
  language: QuizLanguage;

  @ApiProperty({ minimum: MIN_TIME_PER_QUESTION, maximum: MAX_TIME_PER_QUESTION, example: 45 })
  @IsInt()
  @Min(MIN_TIME_PER_QUESTION)
  @Max(MAX_TIME_PER_QUESTION)
  timePerQuestion: number;

  @ApiProperty({ type: [QuestionInputDto], minItems: MIN_QUESTIONS, maxItems: MAX_QUESTIONS })
  @IsArray()
  @ArrayMinSize(MIN_QUESTIONS, { message: `A quiz needs at least ${MIN_QUESTIONS} questions.` })
  @ArrayMaxSize(MAX_QUESTIONS, { message: `A quiz can have at most ${MAX_QUESTIONS} questions.` })
  @ValidateNested({ each: true })
  @Type(() => QuestionInputDto)
  questions: QuestionInputDto[];
}

import { IsString, IsEnum, IsInt, Min, Max, IsIn } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';
import { Difficulty } from '@prisma/client';

export class GenerateQuizDto {
  @ApiProperty({ example: 'Solar System', description: 'Topic for quiz generation' })
  @IsString()
  topic: string;

  @ApiProperty({ enum: Difficulty, example: 'MEDIUM', description: 'Quiz difficulty level' })
  @IsEnum(Difficulty)
  difficulty: Difficulty;

  @ApiProperty({ example: 10, description: 'Number of questions (5-20)', minimum: 5, maximum: 20 })
  @IsInt()
  @Min(5)
  @Max(20)
  numQuestions: number;

  @ApiProperty({ example: 30, description: 'Seconds per question (15-60)', minimum: 15, maximum: 60 })
  @IsInt()
  @Min(15)
  @Max(60)
  timePerQuestion: number;

  @ApiProperty({ example: 'prompt', description: 'Source type: prompt (AI knowledge) or pdf (uploaded document)' })
  @IsIn(['prompt', 'pdf'])
  sourceType: 'prompt' | 'pdf';
}

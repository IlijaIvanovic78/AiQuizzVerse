import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsInt, IsString, Min, IsOptional } from 'class-validator';

export class SubmitAnswerDto {
  @ApiProperty({ description: 'Match ID' })
  @IsString()
  matchId: string;

  @ApiProperty({ description: 'Question ID' })
  @IsString()
  questionId: string;

  @ApiProperty({ description: 'Selected answer index (0-3)' })
  @IsInt()
  @Min(0)
  answer: number;

  @ApiPropertyOptional({ description: 'Time taken in ms' })
  @IsOptional()
  @IsInt()
  @Min(0)
  timeMs?: number;
}

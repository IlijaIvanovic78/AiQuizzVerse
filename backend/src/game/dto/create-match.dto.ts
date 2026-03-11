import { ApiProperty } from '@nestjs/swagger';
import { IsEnum, IsString } from 'class-validator';
import { MatchType } from '@prisma/client';

export class CreateMatchDto {
  @ApiProperty({ enum: ['PVP', 'COOP', 'RANKED', 'SOLO'] })
  @IsEnum(MatchType)
  type: MatchType;

  @ApiProperty({ description: 'Quiz ID to play' })
  @IsString()
  quizId: string;
}

import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { MatchMode } from '@prisma/client';
import { IsEnum, IsNotEmpty, IsOptional, IsString, IsUUID } from 'class-validator';

export class CreateMatchDto {
  @ApiProperty({ example: 'seed-quiz-solar-system' })
  @IsString()
  @IsNotEmpty()
  quizId: string;

  @ApiProperty({ enum: MatchMode })
  @IsEnum(MatchMode, { message: 'Pick SOLO, TEAM or PARTY.' })
  mode: MatchMode;

  @ApiPropertyOptional({ description: 'A friend who gets a match:invite right away' })
  @IsOptional()
  @IsUUID()
  inviteFriendId?: string;
}

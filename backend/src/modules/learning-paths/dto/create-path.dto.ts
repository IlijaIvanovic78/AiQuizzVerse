import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { Audience, QuizLanguage } from '@prisma/client';
import { Transform } from 'class-transformer';
import { IsEnum, IsOptional, IsString, IsUUID, Length } from 'class-validator';
import { trimText } from '../../../common/utils/text.transforms';
import { TOPIC_MAX_LENGTH, TOPIC_MIN_LENGTH } from '../../quizzes/quizzes.constants';

export class CreatePathDto {
  @ApiPropertyOptional({ example: 'Volcanoes', description: 'Needed when there is no documentId' })
  @IsOptional()
  @Transform(trimText)
  @IsString()
  @Length(TOPIC_MIN_LENGTH, TOPIC_MAX_LENGTH)
  topic?: string;

  @ApiPropertyOptional({ format: 'uuid', description: 'An uploaded PDF lesson' })
  @IsOptional()
  @IsUUID()
  documentId?: string;

  @ApiProperty({ enum: Audience })
  @IsEnum(Audience)
  audience: Audience;

  @ApiProperty({ enum: QuizLanguage })
  @IsEnum(QuizLanguage)
  language: QuizLanguage;
}

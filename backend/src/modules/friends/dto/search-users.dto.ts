import { ApiProperty } from '@nestjs/swagger';
import { Transform } from 'class-transformer';
import { IsString, Length } from 'class-validator';
import { trimText } from '../../../common/utils/text.transforms';
import { SEARCH_MAX_LENGTH, SEARCH_MIN_LENGTH } from '../friends.constants';

export class SearchUsersDto {
  @ApiProperty({ example: 'demo', description: 'Part of a nickname, 2-20 characters' })
  @Transform(trimText)
  @IsString()
  @Length(SEARCH_MIN_LENGTH, SEARCH_MAX_LENGTH, {
    message: `Search with ${SEARCH_MIN_LENGTH}-${SEARCH_MAX_LENGTH} characters.`,
  })
  q: string;
}

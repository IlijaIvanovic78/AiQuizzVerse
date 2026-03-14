import { ApiProperty } from '@nestjs/swagger';
import { IsString, MinLength } from 'class-validator';

export class SearchUsersQueryDto {
  @ApiProperty({
    description: 'Search query (username)',
    example: 'john',
    minLength: 1,
  })
  @IsString()
  @MinLength(1)
  q: string;
}

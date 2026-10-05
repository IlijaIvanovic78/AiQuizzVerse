import { ApiProperty } from '@nestjs/swagger';
import { IsString } from 'class-validator';

export class UsernameQueryDto {
  @ApiProperty({ example: 'pixel_hero' })
  @IsString()
  username: string;
}

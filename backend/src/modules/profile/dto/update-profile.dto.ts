import { ApiProperty } from '@nestjs/swagger';
import { IsString, Matches } from 'class-validator';
import { USERNAME_PATTERN, USERNAME_RULE_MESSAGE } from '../../users/users.constants';

export class UpdateProfileDto {
  @ApiProperty({ example: 'pixel_hero', description: '3-20 letters, numbers or underscores' })
  @IsString()
  @Matches(USERNAME_PATTERN, { message: USERNAME_RULE_MESSAGE })
  username: string;
}

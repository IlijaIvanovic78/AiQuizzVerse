import { ApiProperty } from '@nestjs/swagger';
import { IsString, Length } from 'class-validator';

export class JoinMatchDto {
  @ApiProperty({ description: '6-character invite code' })
  @IsString()
  @Length(6, 6)
  inviteCode: string;
}

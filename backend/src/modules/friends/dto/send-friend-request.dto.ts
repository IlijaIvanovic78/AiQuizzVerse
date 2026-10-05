import { ApiProperty } from '@nestjs/swagger';
import { IsUUID } from 'class-validator';

export class SendFriendRequestDto {
  @ApiProperty({ description: 'The player you want to add' })
  @IsUUID('all', { message: 'Pick a player to add.' })
  userId: string;
}

import { ApiProperty } from '@nestjs/swagger';
import { IsUUID } from 'class-validator';

export class InviteFriendDto {
  @ApiProperty()
  @IsUUID()
  friendId: string;
}

import { ApiProperty } from '@nestjs/swagger';
import { Transform, TransformFnParams } from 'class-transformer';
import { IsString, Length } from 'class-validator';
import { INVITE_CODE_LENGTH } from '../matches.constants';

function toNormalizedCode({ value }: TransformFnParams): unknown {
  return typeof value === 'string' ? value.trim().toUpperCase() : value;
}

export class JoinMatchDto {
  @ApiProperty({ example: 'K7QX2M' })
  @Transform(toNormalizedCode)
  @IsString()
  @Length(INVITE_CODE_LENGTH, INVITE_CODE_LENGTH, {
    message: `Invite codes have ${INVITE_CODE_LENGTH} characters.`,
  })
  inviteCode: string;
}

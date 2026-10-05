import { ApiProperty } from '@nestjs/swagger';
import { Transform } from 'class-transformer';
import { IsEmail, IsString, Length, Matches, MaxLength } from 'class-validator';
import { toNormalizedEmail } from '../../../common/utils/text.transforms';
import { USERNAME_PATTERN, USERNAME_RULE_MESSAGE } from '../../users/users.constants';
import { EMAIL_MAX_LENGTH, PASSWORD_MAX_LENGTH, PASSWORD_MIN_LENGTH } from '../auth.constants';

export class RegisterDto {
  @ApiProperty({ example: 'hero@example.com' })
  @Transform(toNormalizedEmail)
  @IsEmail({}, { message: 'Please enter a valid email address.' })
  @MaxLength(EMAIL_MAX_LENGTH)
  email: string;

  @ApiProperty({ example: 'pixel_hero', description: '3-20 letters, numbers or underscores' })
  @IsString()
  @Matches(USERNAME_PATTERN, { message: USERNAME_RULE_MESSAGE })
  username: string;

  @ApiProperty({ example: 'secret123', minLength: PASSWORD_MIN_LENGTH })
  @IsString()
  @Length(PASSWORD_MIN_LENGTH, PASSWORD_MAX_LENGTH, {
    message: `Your password needs ${PASSWORD_MIN_LENGTH}-${PASSWORD_MAX_LENGTH} characters.`,
  })
  password: string;
}

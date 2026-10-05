import { ApiProperty } from '@nestjs/swagger';
import { Transform, TransformFnParams } from 'class-transformer';
import { IsEmail, IsString, Length, Matches, MaxLength } from 'class-validator';
import {
  EMAIL_MAX_LENGTH,
  PASSWORD_MAX_LENGTH,
  PASSWORD_MIN_LENGTH,
  USERNAME_PATTERN,
} from '../auth.constants';

function toNormalizedEmail({ value }: TransformFnParams): unknown {
  return typeof value === 'string' ? value.trim().toLowerCase() : value;
}

export class RegisterDto {
  @ApiProperty({ example: 'hero@example.com' })
  @Transform(toNormalizedEmail)
  @IsEmail({}, { message: 'Please enter a valid email address.' })
  @MaxLength(EMAIL_MAX_LENGTH)
  email: string;

  @ApiProperty({ example: 'pixel_hero', description: '3-20 letters, numbers or underscores' })
  @IsString()
  @Matches(USERNAME_PATTERN, {
    message: 'Your nickname needs 3-20 letters, numbers or underscores.',
  })
  username: string;

  @ApiProperty({ example: 'secret123', minLength: PASSWORD_MIN_LENGTH })
  @IsString()
  @Length(PASSWORD_MIN_LENGTH, PASSWORD_MAX_LENGTH, {
    message: `Your password needs ${PASSWORD_MIN_LENGTH}-${PASSWORD_MAX_LENGTH} characters.`,
  })
  password: string;
}

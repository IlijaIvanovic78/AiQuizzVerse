import { IsEmail, IsString, MinLength, MaxLength, Matches } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class RegisterDto {
  @ApiProperty({ example: 'player@quizverse.com', description: 'User email address' })
  @IsEmail({}, { message: 'Invalid email address' })
  email: string;

  @ApiProperty({ example: 'QuizMaster42', description: 'Unique username (3-20 chars)', minLength: 3, maxLength: 20 })
  @IsString()
  @MinLength(3, { message: 'Username must be at least 3 characters long' })
  @MaxLength(20, { message: 'Username must not exceed 20 characters' })
  @Matches(/^[a-zA-Z0-9_-]+$/, {
    message: 'Username can only contain letters, numbers, underscores and hyphens',
  })
  username: string;

  @ApiProperty({ example: 'StrongP@ss1', description: 'Password (min 6 chars)', minLength: 6 })
  @IsString()
  @MinLength(6, { message: 'Password must be at least 6 characters long' })
  password: string;
}

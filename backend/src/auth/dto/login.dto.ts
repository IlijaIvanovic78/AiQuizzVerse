import { IsEmail, IsString, MinLength } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class LoginDto {
  @ApiProperty({ example: 'player@quizverse.com', description: 'User email address' })
  @IsEmail({}, { message: 'Invalid email address' })
  email: string;

  @ApiProperty({ example: 'StrongP@ss1', description: 'User password' })
  @IsString()
  @MinLength(1, { message: 'Password is required' })
  password: string;
}

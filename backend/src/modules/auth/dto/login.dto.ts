import { ApiProperty } from '@nestjs/swagger';

/** Documents the login body; LocalStrategy reads and checks these fields itself. */
export class LoginDto {
  @ApiProperty({ example: 'demo@quizverse.dev' })
  email: string;

  @ApiProperty({ example: 'demo1234' })
  password: string;
}

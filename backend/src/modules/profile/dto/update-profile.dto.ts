import { ApiPropertyOptional } from '@nestjs/swagger';
import { IsOptional, IsString, Length, IsUrl } from 'class-validator';

export class UpdateProfileDto {
  @ApiPropertyOptional({
    description: 'Username (3-20 characters)',
    example: 'newusername123',
    minLength: 3,
    maxLength: 20,
  })
  @IsOptional()
  @IsString()
  @Length(3, 20)
  username?: string;

  @ApiPropertyOptional({
    description: 'Avatar URL',
    example: 'https://example.com/avatar.png',
  })
  @IsOptional()
  @IsString()
  @IsUrl()
  avatarUrl?: string;

  @ApiPropertyOptional({
    description: 'Pet image URL',
    example: 'https://example.com/pet.png',
  })
  @IsOptional()
  @IsString()
  @IsUrl()
  petUrl?: string;
}

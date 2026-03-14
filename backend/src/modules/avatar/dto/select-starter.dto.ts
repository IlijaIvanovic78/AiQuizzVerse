import { IsNotEmpty, IsString } from 'class-validator';

export class SelectStarterDto {
  @IsNotEmpty()
  @IsString()
  itemId: string;
}

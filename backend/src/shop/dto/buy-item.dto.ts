import { IsString, IsNotEmpty } from 'class-validator';

export class BuyItemDto {
  @IsString()
  @IsNotEmpty()
  itemId: string;
}

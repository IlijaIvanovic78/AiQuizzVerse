import { IsString, IsNotEmpty, IsInt, Min, Max, IsOptional } from 'class-validator';

export class CreateJourneyDto {
  @IsString()
  @IsNotEmpty()
  topic: string;

  @IsInt()
  @Min(3)
  @Max(12)
  @IsOptional()
  totalStages?: number = 8;
}

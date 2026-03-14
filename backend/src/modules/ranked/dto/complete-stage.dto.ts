import { IsInt, Min } from 'class-validator';

export class CompleteStageDto {
  @IsInt()
  @Min(0)
  score: number;
}

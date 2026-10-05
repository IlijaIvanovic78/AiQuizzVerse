import { Module } from '@nestjs/common';
import { LearningPathsService } from './learning-paths.service';

@Module({
  providers: [LearningPathsService],
  exports: [LearningPathsService],
})
export class LearningPathsModule {}

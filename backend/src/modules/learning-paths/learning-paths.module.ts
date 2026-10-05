import { Module } from '@nestjs/common';
import { AiModule } from '../ai/ai.module';
import { DocumentsModule } from '../documents/documents.module';
import { QuizzesModule } from '../quizzes/quizzes.module';
import { RealtimeModule } from '../realtime/realtime.module';
import { LearningPathsController } from './learning-paths.controller';
import { LearningPathsService } from './learning-paths.service';
import { PathGenerationService } from './path-generation.service';

@Module({
  imports: [AiModule, DocumentsModule, QuizzesModule, RealtimeModule],
  controllers: [LearningPathsController],
  providers: [LearningPathsService, PathGenerationService],
  exports: [LearningPathsService],
})
export class LearningPathsModule {}

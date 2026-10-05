import { Module } from '@nestjs/common';
import { AiModule } from '../ai/ai.module';
import { DocumentsModule } from '../documents/documents.module';
import { RealtimeModule } from '../realtime/realtime.module';
import { GenerationLimitsService } from './generation-limits.service';
import { QuizGenerationService } from './quiz-generation.service';
import { QuizzesController } from './quizzes.controller';
import { QuizzesService } from './quizzes.service';

@Module({
  imports: [AiModule, DocumentsModule, RealtimeModule],
  controllers: [QuizzesController],
  providers: [QuizzesService, QuizGenerationService, GenerationLimitsService],
  exports: [QuizzesService, GenerationLimitsService],
})
export class QuizzesModule {}

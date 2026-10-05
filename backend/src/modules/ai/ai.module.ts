import { Module } from '@nestjs/common';
import { QuizWriterService } from './quiz-writer.service';

@Module({
  providers: [QuizWriterService],
  exports: [QuizWriterService],
})
export class AiModule {}

import { Module } from '@nestjs/common';
import { AiController } from './ai.controller';
import { AiService } from './ai.service';
import { EmbeddingsService } from './rag/embeddings.service';
import { RetrieverService } from './rag/retriever.service';

@Module({
  controllers: [AiController],
  providers: [AiService, EmbeddingsService, RetrieverService],
  exports: [AiService, EmbeddingsService, RetrieverService],
})
export class AiModule {}

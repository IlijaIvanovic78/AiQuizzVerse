import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../../infrastructure/prisma/prisma.service';
import { EmbeddingsService } from './embeddings.service';

@Injectable()
export class RetrieverService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly embeddingsService: EmbeddingsService,
  ) {}

  async retrieve(query: string, userId: string, topK = 5): Promise<string[]> {
    const queryEmbedding = await this.embeddingsService.embedText(query);
    const vectorStr = `[${queryEmbedding.join(',')}]`;

    const results = await this.prisma.$queryRaw<{ content: string }[]>`
      SELECT content FROM document_chunks
      WHERE user_id = ${userId}
      ORDER BY embedding <=> ${vectorStr}::vector
      LIMIT ${topK}
    `;

    return results.map((r) => r.content);
  }
}

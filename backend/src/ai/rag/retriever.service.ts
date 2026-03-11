import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
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

    const results: { content: string }[] = await this.prisma.$queryRawUnsafe(
      `SELECT content FROM document_chunks
       WHERE user_id = $1
       ORDER BY embedding <=> $2::vector
       LIMIT $3`,
      userId,
      vectorStr,
      topK,
    );

    return results.map((r) => r.content);
  }
}

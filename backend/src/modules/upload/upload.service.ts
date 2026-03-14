import { Injectable, Logger } from '@nestjs/common';
import { PrismaService } from '../../infrastructure/prisma/prisma.service';
import { EmbeddingsService } from '../ai/rag/embeddings.service';
import { PDFParse } from 'pdf-parse';
import { DEFAULT_CHUNK_SIZE, DEFAULT_CHUNK_OVERLAP, EMBEDDING_BATCH_SIZE } from '../../core/constants/upload.constants';

@Injectable()
export class UploadService {
  private readonly logger = new Logger(UploadService.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly embeddingsService: EmbeddingsService,
  ) {}

  async parsePDF(buffer: Buffer): Promise<string> {
    const parser = new PDFParse({ data: new Uint8Array(buffer) });
    const result = await parser.getText();
    await parser.destroy();
    return result.text;
  }

  chunkText(text: string, chunkSize = DEFAULT_CHUNK_SIZE, overlap = DEFAULT_CHUNK_OVERLAP): string[] {
    const chunks: string[] = [];
    let start = 0;

    while (start < text.length) {
      const end = Math.min(start + chunkSize, text.length);
      const chunk = text.slice(start, end).trim();
      if (chunk.length > 0) {
        chunks.push(chunk);
      }
      start += chunkSize - overlap;
    }

    return chunks;
  }

  async storeChunks(chunks: string[], fileName: string, userId: string): Promise<number> {
    let stored = 0;

    for (let i = 0; i < chunks.length; i += EMBEDDING_BATCH_SIZE) {
      const batch = chunks.slice(i, i + EMBEDDING_BATCH_SIZE);
      const embeddings = await this.embeddingsService.embedTexts(batch);

      for (let j = 0; j < batch.length; j++) {
        const vectorStr = `[${embeddings[j].join(',')}]`;
        await this.prisma.$executeRaw`
          INSERT INTO document_chunks (id, content, embedding, source_file, user_id, created_at)
          VALUES (gen_random_uuid(), ${batch[j]}, ${vectorStr}::vector, ${fileName}, ${userId}, NOW())
        `;
        stored++;
      }
    }

    this.logger.log(`Stored ${stored} chunks for file "${fileName}" (user: ${userId})`);
    return stored;
  }
}

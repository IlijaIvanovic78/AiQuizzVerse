import { Injectable, Logger } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { EmbeddingsService } from '../ai/rag/embeddings.service';
import { PDFParse } from 'pdf-parse';

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

  chunkText(text: string, chunkSize = 800, overlap = 200): string[] {
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
    const BATCH_SIZE = 10;
    let stored = 0;

    for (let i = 0; i < chunks.length; i += BATCH_SIZE) {
      const batch = chunks.slice(i, i + BATCH_SIZE);
      const embeddings = await this.embeddingsService.embedTexts(batch);

      for (let j = 0; j < batch.length; j++) {
        const vectorStr = `[${embeddings[j].join(',')}]`;
        await this.prisma.$executeRawUnsafe(
          `INSERT INTO document_chunks (id, content, embedding, source_file, user_id, created_at)
           VALUES (gen_random_uuid(), $1, $2::vector, $3, $4, NOW())`,
          batch[j],
          vectorStr,
          fileName,
          userId,
        );
        stored++;
      }
    }

    this.logger.log(`Stored ${stored} chunks for file "${fileName}" (user: ${userId})`);
    return stored;
  }
}

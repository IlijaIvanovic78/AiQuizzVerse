import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { OpenAIEmbeddings } from '@langchain/openai';

@Injectable()
export class EmbeddingsService {
  private readonly embeddings: OpenAIEmbeddings;

  constructor(private readonly configService: ConfigService) {
    this.embeddings = new OpenAIEmbeddings({
      openAIApiKey: this.configService.get<string>('OPENAI_API_KEY'),
      modelName: 'text-embedding-ada-002',
    });
  }

  async embedText(text: string): Promise<number[]> {
    return this.embeddings.embedQuery(text);
  }

  async embedTexts(texts: string[]): Promise<number[][]> {
    return this.embeddings.embedDocuments(texts);
  }
}

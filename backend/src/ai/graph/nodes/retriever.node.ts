import { RetrieverService } from '../../rag/retriever.service';
import { QuizGeneratorStateType } from '../state';

export function createRetrieverNode(retrieverService: RetrieverService) {
  return async (state: QuizGeneratorStateType): Promise<Partial<QuizGeneratorStateType>> => {
    if (state.sourceType === 'pdf') {
      const chunks = await retrieverService.retrieve(state.topic, state.userId, 5);
      return {
        context: chunks.join('\n\n---\n\n'),
        status: 'generating',
      };
    }

    return {
      context: '',
      status: 'generating',
    };
  };
}

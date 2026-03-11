import { StateGraph, END, START } from '@langchain/langgraph';
import { QuizGeneratorState, QuizGeneratorStateType } from './state';
import { createRetrieverNode } from './nodes/retriever.node';
import { createGeneratorNode } from './nodes/generator.node';
import { createCriticNode } from './nodes/critic.node';
import { RetrieverService } from '../rag/retriever.service';

const MAX_ITERATIONS = 3;

export function createQuizGeneratorGraph(
  retrieverService: RetrieverService,
  openAIApiKey: string,
) {
  const retrieverNode = createRetrieverNode(retrieverService);
  const generatorNode = createGeneratorNode(openAIApiKey);
  const criticNode = createCriticNode(openAIApiKey);

  const graph = new StateGraph(QuizGeneratorState)
    .addNode('retriever', retrieverNode)
    .addNode('generator', generatorNode)
    .addNode('critic', criticNode)
    .addEdge(START, 'retriever')
    .addEdge('retriever', 'generator')
    .addEdge('generator', 'critic')
    .addConditionalEdges('critic', (state: QuizGeneratorStateType) => {
      if (state.status === 'complete') {
        return END;
      }
      if (state.iteration >= MAX_ITERATIONS) {
        return END;
      }
      return 'generator';
    });

  return graph.compile();
}

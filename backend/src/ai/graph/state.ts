import { Annotation } from '@langchain/langgraph';
import { Difficulty } from '@prisma/client';

export interface GeneratedQuestion {
  text: string;
  options: string[];
  correctAnswer: number;
  explanation: string;
}

export const QuizGeneratorState = Annotation.Root({
  topic: Annotation<string>,
  difficulty: Annotation<Difficulty>,
  numQuestions: Annotation<number>,
  timePerQuestion: Annotation<number>,
  sourceType: Annotation<'prompt' | 'pdf'>,
  userId: Annotation<string>,
  context: Annotation<string>,
  questions: Annotation<GeneratedQuestion[]>,
  feedback: Annotation<string>,
  iteration: Annotation<number>,
  status: Annotation<'retrieving' | 'generating' | 'reviewing' | 'complete' | 'failed'>,
});

export type QuizGeneratorStateType = typeof QuizGeneratorState.State;

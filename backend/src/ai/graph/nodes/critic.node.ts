import { ChatOpenAI } from '@langchain/openai';
import { QuizGeneratorStateType } from '../state';

const CRITIC_PROMPT = `You are a quiz quality reviewer. Evaluate the following quiz questions and determine if they meet quality standards.

Topic: "{topic}"
Difficulty: {difficulty}
Expected number of questions: {numQuestions}

Questions to review:
{questions}

EVALUATION CRITERIA:
1. CORRECTNESS: Is each correct answer actually correct?
2. PLAUSIBILITY: Are wrong options plausible but clearly wrong?
3. DIFFICULTY: Do questions match the specified difficulty level?
4. UNIQUENESS: Are there any duplicate or very similar questions?
5. CLARITY: Are questions clear and unambiguous?
6. COUNT: Are there exactly {numQuestions} questions?
7. FORMAT: Does each question have exactly 4 options with correctAnswer being 0-3?

Respond with ONLY a valid JSON object:
{{
  "pass": true/false,
  "feedback": "Detailed feedback about issues found, or empty string if all checks pass."
}}`;

export function createCriticNode(openAIApiKey: string) {
  const llm = new ChatOpenAI({
    openAIApiKey,
    modelName: 'gpt-4',
    temperature: 0.2,
  });

  return async (state: QuizGeneratorStateType): Promise<Partial<QuizGeneratorStateType>> => {
    if (!state.questions || state.questions.length === 0) {
      return {
        feedback: 'No questions were generated. Please generate questions.',
        status: 'generating' as const,
        iteration: state.iteration + 1,
      };
    }

    const prompt = CRITIC_PROMPT
      .replaceAll('{topic}', state.topic)
      .replaceAll('{difficulty}', state.difficulty)
      .replaceAll('{numQuestions}', String(state.numQuestions))
      .replace('{questions}', JSON.stringify(state.questions, null, 2));

    const response = await llm.invoke(prompt);
    const content = typeof response.content === 'string'
      ? response.content
      : JSON.stringify(response.content);

    const jsonMatch = content.match(/\{[\s\S]*\}/);
    if (!jsonMatch) {
      return {
        status: 'complete',
        iteration: state.iteration + 1,
      };
    }

    const evaluation = JSON.parse(jsonMatch[0]);

    if (evaluation.pass) {
      return {
        status: 'complete',
        feedback: '',
      };
    }

    return {
      feedback: evaluation.feedback,
      status: 'generating' as const,
      iteration: state.iteration + 1,
    };
  };
}

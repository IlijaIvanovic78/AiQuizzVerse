import { ChatOpenAI } from '@langchain/openai';
import { QuizGeneratorStateType, GeneratedQuestion } from '../state';

const GENERATOR_PROMPT = `You are a quiz question generator. Generate exactly {numQuestions} multiple-choice questions about the topic "{topic}" at {difficulty} difficulty level.

{contextBlock}
{feedbackBlock}

RULES:
- Each question must have exactly 4 answer options (A, B, C, D).
- Exactly one option must be correct.
- The correctAnswer field is the 0-based index of the correct option (0=A, 1=B, 2=C, 3=D).
- Include a brief explanation for why the correct answer is right.
- Questions should be clear, unambiguous, and educational.
- Difficulty guide: EASY=basic recall, MEDIUM=understanding, HARD=analysis, EXPERT=deep expertise.
- All questions and answers must be in English.
- Do NOT repeat questions.

Respond with ONLY a valid JSON array. Each element must have this exact structure:
[
  {{
    "text": "Question text here?",
    "options": ["Option A", "Option B", "Option C", "Option D"],
    "correctAnswer": 0,
    "explanation": "Brief explanation of why this is correct."
  }}
]`;

export function createGeneratorNode(openAIApiKey: string) {
  const llm = new ChatOpenAI({
    openAIApiKey,
    modelName: 'gpt-4',
    temperature: 0.7,
  });

  return async (state: QuizGeneratorStateType): Promise<Partial<QuizGeneratorStateType>> => {
    const contextBlock = state.context
      ? `Use the following context to generate questions:\n\n${state.context}`
      : 'Use your general knowledge about the topic.';

    const feedbackBlock = state.feedback
      ? `\nPREVIOUS ATTEMPT FEEDBACK (fix these issues):\n${state.feedback}`
      : '';

    const prompt = GENERATOR_PROMPT
      .replace('{numQuestions}', String(state.numQuestions))
      .replace('{topic}', state.topic)
      .replace('{difficulty}', state.difficulty)
      .replace('{contextBlock}', contextBlock)
      .replace('{feedbackBlock}', feedbackBlock);

    const response = await llm.invoke(prompt);
    const content = typeof response.content === 'string'
      ? response.content
      : JSON.stringify(response.content);

    const jsonMatch = content.match(/\[[\s\S]*\]/);
    if (!jsonMatch) {
      return {
        questions: [],
        status: 'reviewing',
        iteration: state.iteration + 1,
        feedback: 'Failed to parse response as JSON. Please return a valid JSON array.',
      };
    }

    const questions: GeneratedQuestion[] = JSON.parse(jsonMatch[0]);

    return {
      questions,
      status: 'reviewing',
    };
  };
}

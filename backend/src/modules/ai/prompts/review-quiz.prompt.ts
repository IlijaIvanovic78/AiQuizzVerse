import { BaseMessage, HumanMessage, SystemMessage } from '@langchain/core/messages';
import { GeneratedQuestion } from '../ai.schemas';
import { QuizRequest } from '../ai.types';
import { AUDIENCE_NAMES, LANGUAGE_NAMES } from './quiz-guidance';

export interface DraftToReview {
  title: string;
  questions: GeneratedQuestion[];
  keyPoints?: string[];
}

const OPTION_LETTERS = ['A', 'B', 'C', 'D'];

export function reviewQuizMessages(
  request: QuizRequest,
  draft: DraftToReview,
  context: string | null,
): BaseMessage[] {
  const source = context
    ? 'true and supported by the lesson text'
    : 'true and generally accepted by experts';
  const system = `You are a careful fact-checker and teacher. You review multiple-choice quizzes for AI QuizVerse before players see them.

The players are ${AUDIENCE_NAMES[request.audience]}. The quiz must be written in ${LANGUAGE_NAMES[request.language]}.

Check every question carefully:
1. The option marked [CORRECT] really is correct. Answer the question yourself first, then compare.
2. No other option is also correct or partly correct (for example "Fruits" next to the correct "Plants"). A comparison (biggest, first, most) must say "of these" unless the correct option is the true record holder.
3. The question, options, hint and explanation are ${source}. Report every name, date, number or event that you are not completely sure is real and correct; a made-up fact is the worst possible mistake. Also report questions about counts or records that change over time, such as the number of known moons.
4. The question is specific and clear, with exactly one sensible answer. "Which dinosaur had sharp claws?" is too vague, because many did.
5. The hint does not contain the correct answer, does not give away its letters or sound, does not point to an option and does not make the question trivial by naming the best-known feature of the correct answer.
6. The wording suits the players, and the text is natural and grammatical in the quiz language.
If there are key points, check that they are true and that they teach what the questions ask.

Be strict about facts, ambiguity and hints, but ignore small style preferences. List each problem in one sentence that starts with the question number (for example "Q3: ...") and says exactly what is wrong. Approve the quiz only when the list is empty.`;

  return [new SystemMessage(system), new HumanMessage(describeDraft(draft, context))];
}

function describeDraft(draft: DraftToReview, context: string | null): string {
  const parts = [`Title: ${draft.title}`];
  if (draft.keyPoints) {
    parts.push(`Key points:\n${draft.keyPoints.map((point) => `- ${point}`).join('\n')}`);
  }
  parts.push(...draft.questions.map(describeQuestion));
  if (context) {
    parts.push(`<lesson>\n${context}\n</lesson>`);
  }
  return parts.join('\n\n');
}

function describeQuestion(question: GeneratedQuestion, index: number): string {
  const options = question.options.map((option, optionIndex) => {
    const mark = optionIndex === question.correctIndex ? ' [CORRECT]' : '';
    return `  ${OPTION_LETTERS[optionIndex] ?? '?'}) ${option}${mark}`;
  });
  return [
    `Q${index + 1}. ${question.text}`,
    ...options,
    `  Hint: ${question.hint}`,
    `  Explanation: ${question.explanation}`,
  ].join('\n');
}

import { AIMessage, BaseMessage, HumanMessage, SystemMessage } from '@langchain/core/messages';
import { GeneratedQuiz } from '../ai.schemas';
import { QuizRequest } from '../ai.types';
import { lessonBlock, quizMasterBrief, revisionRequest } from './quiz-guidance';

const QUIZ_FIELDS = `Quiz fields:
- title: a short, inviting title of 2-6 words in the quiz language.
- theme: the category that fits the topic best (GENERAL if none fits).
- questions: the questions, following the rules above.`;

export function writeQuizMessages(request: QuizRequest, context: string | null): BaseMessage[] {
  const subject = request.topic ?? 'the lesson below';
  const task = `Write a quiz with exactly ${request.questionCount} questions about: ${subject}.`;
  return [
    new SystemMessage(`${quizMasterBrief(request)}\n\n${QUIZ_FIELDS}`),
    new HumanMessage(task + lessonBlock(context, request.language)),
  ];
}

export function reviseQuizMessages(
  request: QuizRequest,
  context: string | null,
  draft: GeneratedQuiz,
  problems: string[],
): BaseMessage[] {
  return [
    ...writeQuizMessages(request, context),
    new AIMessage(JSON.stringify(draft)),
    new HumanMessage(revisionRequest(problems)),
  ];
}

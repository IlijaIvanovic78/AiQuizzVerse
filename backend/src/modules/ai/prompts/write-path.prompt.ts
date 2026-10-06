import { AIMessage, BaseMessage, HumanMessage, SystemMessage } from '@langchain/core/messages';
import { MAX_KEY_POINTS, MIN_KEY_POINTS } from '../ai.constants';
import { GeneratedPathStep } from '../ai.schemas';
import { PathStepRequest } from '../ai.types';
import { lessonBlock, quizMasterBrief, revisionRequest } from './quiz-guidance';

export function writePathStepMessages(
  request: PathStepRequest,
  context: string | null,
): BaseMessage[] {
  const subject = request.topic ?? 'the lesson below';
  const task = [
    `Learning path topic: ${subject}.`,
    `This is step ${request.position} ("${request.label}"), so stay in lane ${request.position}.`,
    `Write the study card and exactly ${request.questionCount} questions.`,
  ].join('\n');

  return [
    new SystemMessage(`${quizMasterBrief(request)}\n\n${pathStepFields(request.stepFocuses)}`),
    new HumanMessage(task + lessonBlock(context, request.language)),
  ];
}

export function revisePathStepMessages(
  request: PathStepRequest,
  context: string | null,
  draft: GeneratedPathStep,
  problems: string[],
): BaseMessage[] {
  return [
    ...writePathStepMessages(request, context),
    new AIMessage(JSON.stringify(draft)),
    new HumanMessage(revisionRequest(problems)),
  ];
}

function pathStepFields(stepFocuses: string[]): string {
  const lanes = stepFocuses.map((focus, index) => `${index + 1}. ${focus}`).join('\n');
  return `You are writing one step of a ${stepFocuses.length}-step learning path. In every step the player first reads a study card (the title and key points), then plays a short quiz about it.

The ${stepFocuses.length} steps are written at the same time, so each one must stay in its own lane:
${lanes}
Teach and ask only what belongs to your step, so the steps never repeat each other.

Step fields:
- title: a short name of 2-5 words, in the quiz language, that says what this step teaches about this topic. It names the topic or something from it, for example "Meet the dinosaurs", "How leaves make food" or "Dino expert challenge". Never use the general name of the step, or one like "First steps", "Key facts" or "Master challenge", as the title.
- theme: the category that fits the topic best (GENERAL if none fits).
- keyPoints: ${MIN_KEY_POINTS} to ${MAX_KEY_POINTS} key points for the study card. Each one is a single short, complete sentence with one clear fact. Together they teach everything the questions ask about.
- questions: the quiz for this step, following the rules above. A player who read the key points carefully can answer every question.`;
}

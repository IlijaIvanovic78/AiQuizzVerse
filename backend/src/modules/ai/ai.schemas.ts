import { QuizTheme } from '@prisma/client';
import { z } from 'zod';
import { MAX_KEY_POINTS, MIN_KEY_POINTS, OPTIONS_PER_QUESTION } from './ai.constants';

const questionSchema = z.object({
  text: z.string().describe('The question'),
  options: z
    .array(z.string())
    .length(OPTIONS_PER_QUESTION)
    .describe('Four short answer options, exactly one of them correct'),
  correctIndex: z.number().int().describe('0-based position of the correct option'),
  explanation: z.string().describe('1-2 sentences shown after the answer: why it is right'),
  hint: z.string().describe('One sentence that helps the player think without giving the answer'),
});

export const quizSchema = z.object({
  title: z.string().describe('Short quiz title in the quiz language'),
  theme: z.enum(QuizTheme).describe('The category that fits best, GENERAL if none fits'),
  questions: z.array(questionSchema),
});

// problems comes first so the model lists them before it decides.
export const reviewSchema = z.object({
  problems: z
    .array(z.string())
    .describe('One sentence per problem, starting with the question number, e.g. "Q3: ..."'),
  approved: z.boolean().describe('True only when there are no problems'),
});

export const pathStepSchema = z.object({
  title: z.string().describe('Short name of this step, in the quiz language'),
  theme: z.enum(QuizTheme).describe('The category that fits best, GENERAL if none fits'),
  keyPoints: z
    .array(z.string())
    .min(MIN_KEY_POINTS)
    .max(MAX_KEY_POINTS)
    .describe('Short facts for the study card; together they teach everything the quiz asks'),
  questions: z.array(questionSchema),
});

export type GeneratedQuestion = z.infer<typeof questionSchema>;
export type GeneratedQuiz = z.infer<typeof quizSchema>;
export type QuizReview = z.infer<typeof reviewSchema>;
export type GeneratedPathStep = z.infer<typeof pathStepSchema>;

import { BaseMessage } from '@langchain/core/messages';
import { ChatOpenAI } from '@langchain/openai';
import { Injectable, Logger, ServiceUnavailableException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import {
  AI_MAX_RETRIES,
  AI_RESTING_MESSAGE,
  AI_TIMEOUT_MS,
  QUIZ_MODEL,
  REVIEWER_TEMPERATURE,
  WRITER_TEMPERATURE,
} from './ai.constants';
import { cleanKeyPoints, validateAndShuffle } from './ai.rules';
import {
  GeneratedPathStep,
  GeneratedQuiz,
  pathStepSchema,
  QuizReview,
  quizSchema,
  reviewSchema,
} from './ai.schemas';
import { PathStepRequest, QuizRequest, WriterStep } from './ai.types';
import { DraftToReview, reviewQuizMessages } from './prompts/review-quiz.prompt';
import { revisePathStepMessages, writePathStepMessages } from './prompts/write-path.prompt';
import { reviseQuizMessages, writeQuizMessages } from './prompts/write-quiz.prompt';

@Injectable()
export class QuizWriterService {
  private readonly logger = new Logger(QuizWriterService.name);

  constructor(private readonly config: ConfigService) {}

  async writeQuiz(
    request: QuizRequest,
    context: string | null,
    onStep?: (step: WriterStep) => void,
  ): Promise<GeneratedQuiz> {
    onStep?.('writing');
    let quiz = await this.draftQuiz(writeQuizMessages(request, context));
    onStep?.('reviewing');
    const review = await this.reviewDraft(request, quiz, context);
    if (!review.approved) {
      quiz = await this.draftQuiz(reviseQuizMessages(request, context, quiz, review.problems));
    }
    return { ...quiz, questions: validateAndShuffle(quiz.questions, request.questionCount) };
  }

  async writePathStep(
    request: PathStepRequest,
    context: string | null,
    previousTitles: string[],
  ): Promise<GeneratedPathStep> {
    let step = await this.draftPathStep(writePathStepMessages(request, context, previousTitles));
    const review = await this.reviewDraft(request, step, context);
    if (!review.approved) {
      step = await this.draftPathStep(
        revisePathStepMessages(request, context, previousTitles, step, review.problems),
      );
    }
    return {
      ...step,
      keyPoints: cleanKeyPoints(step.keyPoints),
      questions: validateAndShuffle(step.questions, request.questionCount),
    };
  }

  private draftQuiz(messages: BaseMessage[]): Promise<GeneratedQuiz> {
    const writer = this.createModel(WRITER_TEMPERATURE).withStructuredOutput(quizSchema, {
      name: 'quiz',
      strict: true,
    });
    return this.callOpenAi('quiz draft', () => writer.invoke(messages));
  }

  private draftPathStep(messages: BaseMessage[]): Promise<GeneratedPathStep> {
    const writer = this.createModel(WRITER_TEMPERATURE).withStructuredOutput(pathStepSchema, {
      name: 'path_step',
      strict: true,
    });
    return this.callOpenAi('path step draft', () => writer.invoke(messages));
  }

  private reviewDraft(
    request: QuizRequest,
    draft: DraftToReview,
    context: string | null,
  ): Promise<QuizReview> {
    const reviewer = this.createModel(REVIEWER_TEMPERATURE).withStructuredOutput(reviewSchema, {
      name: 'quiz_review',
      strict: true,
    });
    const messages = reviewQuizMessages(request, draft, context);
    return this.callOpenAi('quiz review', () => reviewer.invoke(messages));
  }

  private createModel(temperature: number): ChatOpenAI {
    const apiKey = this.config.get<string>('OPENAI_API_KEY');
    if (!apiKey) {
      this.logger.error('OPENAI_API_KEY is not set');
      throw new ServiceUnavailableException(AI_RESTING_MESSAGE);
    }
    return new ChatOpenAI({
      apiKey,
      model: QUIZ_MODEL,
      temperature,
      timeout: AI_TIMEOUT_MS,
      maxRetries: AI_MAX_RETRIES,
    });
  }

  private async callOpenAi<T>(task: string, call: () => Promise<T>): Promise<T> {
    try {
      return await call();
    } catch (error) {
      this.logger.error(`OpenAI ${task} failed`, error instanceof Error ? error.stack : error);
      throw new ServiceUnavailableException(AI_RESTING_MESSAGE);
    }
  }
}

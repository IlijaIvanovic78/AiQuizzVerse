import { BadRequestException, Injectable } from '@nestjs/common';
import { LearningPath, Prisma } from '@prisma/client';
import { PrismaService } from '../../prisma/prisma.service';
import { specificStepTitle } from '../ai/ai.rules';
import { GeneratedPathStep } from '../ai/ai.schemas';
import { PathStepRequest } from '../ai/ai.types';
import { QuizWriterService } from '../ai/quiz-writer.service';
import { WeakQuizException } from '../ai/weak-quiz.exception';
import { DocumentsService } from '../documents/documents.service';
import { GenerationLimitsService } from '../quizzes/generation-limits.service';
import { TOPIC_OR_DOCUMENT_MESSAGE } from '../quizzes/quizzes.constants';
import { QuizzesService } from '../quizzes/quizzes.service';
import { NotificationsService } from '../realtime/notifications.service';
import { CreatePathDto } from './dto/create-path.dto';
import {
  PATH_GENERATION_COST,
  PATH_PLAN,
  STEP_TIME_PER_QUESTION,
} from './learning-paths.constants';
import { buildStepRequests } from './learning-paths.rules';
import { LearningPathsService } from './learning-paths.service';
import { PathDetail, PlannedStep } from './learning-paths.types';

@Injectable()
export class PathGenerationService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly quizWriter: QuizWriterService,
    private readonly documents: DocumentsService,
    private readonly quizzes: QuizzesService,
    private readonly limits: GenerationLimitsService,
    private readonly notifications: NotificationsService,
    private readonly paths: LearningPathsService,
  ) {}

  async createPath(userId: string, dto: CreatePathDto): Promise<PathDetail> {
    const lesson = dto.documentId ? await this.documents.getLesson(userId, dto.documentId) : null;
    // A path is named after the typed topic or, for a PDF, after the lesson file.
    const subject = dto.topic ?? lesson?.name;
    if (!subject) {
      throw new BadRequestException(TOPIC_OR_DOCUMENT_MESSAGE);
    }
    const context = lesson?.context ?? null;
    return this.limits.runWithLimits(userId, PATH_GENERATION_COST, () =>
      this.writeAndSave(userId, dto, subject, context),
    );
  }

  private async writeAndSave(
    userId: string,
    dto: CreatePathDto,
    subject: string,
    context: string | null,
  ): Promise<PathDetail> {
    const steps = await this.writeSteps(userId, dto, subject, context);
    const pathId = await this.savePath(userId, dto, subject, steps);
    return this.paths.findDetail(userId, pathId);
  }

  // All steps are written in parallel and Promise.all returns them in plan order. If a step
  // fails (a weak one only after its retry), Promise.all rejects at once and nothing is saved.
  // The other OpenAI calls still run to the end in the background, but their steps are dropped.
  private writeSteps(
    userId: string,
    dto: CreatePathDto,
    subject: string,
    context: string | null,
  ): Promise<GeneratedPathStep[]> {
    const requests = buildStepRequests({
      topic: dto.topic ?? null,
      audience: dto.audience,
      language: dto.language,
    });
    let done = 0;
    this.reportProgress(userId, done);

    return Promise.all(
      requests.map(async (request) => {
        const step = await this.writeStepWithRetry(request, context);
        done += 1;
        this.reportProgress(userId, done);
        return { ...step, title: specificStepTitle(step.title, request.label, subject) };
      }),
    );
  }

  /** Too few good questions is often bad luck, so a weak step is written once more. */
  private async writeStepWithRetry(
    request: PathStepRequest,
    context: string | null,
  ): Promise<GeneratedPathStep> {
    try {
      return await this.quizWriter.writePathStep(request, context);
    } catch (error) {
      if (!(error instanceof WeakQuizException)) {
        throw error;
      }
      return this.quizWriter.writePathStep(request, context);
    }
  }

  private savePath(
    userId: string,
    dto: CreatePathDto,
    subject: string,
    steps: GeneratedPathStep[],
  ): Promise<string> {
    return this.prisma.$transaction(async (tx) => {
      const path = await tx.learningPath.create({
        data: {
          ownerId: userId,
          topic: subject,
          documentId: dto.documentId ?? null,
          audience: dto.audience,
          language: dto.language,
        },
      });
      for (const [index, step] of steps.entries()) {
        await this.saveStep(tx, path, PATH_PLAN[index], step);
      }
      return path.id;
    });
  }

  private async saveStep(
    tx: Prisma.TransactionClient,
    path: LearningPath,
    plan: PlannedStep,
    step: GeneratedPathStep,
  ): Promise<void> {
    const quizId = await this.quizzes.saveGeneratedQuiz(
      {
        ownerId: path.ownerId,
        kind: 'PATH_STEP',
        topic: path.topic,
        documentId: path.documentId,
        difficulty: plan.difficulty,
        audience: path.audience,
        language: path.language,
        timePerQuestion: STEP_TIME_PER_QUESTION[path.audience],
        quiz: step,
      },
      tx,
    );
    await tx.pathStep.create({
      data: {
        pathId: path.id,
        position: plan.position,
        title: step.title,
        keyPoints: step.keyPoints,
        difficulty: plan.difficulty,
        quizId,
      },
    });
  }

  private reportProgress(userId: string, done: number): void {
    this.notifications.emitToUser(userId, 'quiz:progress', {
      step: 'writing',
      done,
      total: PATH_PLAN.length,
    });
  }
}

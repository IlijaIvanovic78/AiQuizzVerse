import { BadRequestException, Injectable } from '@nestjs/common';
import { LearningPath, Prisma } from '@prisma/client';
import { PrismaService } from '../../prisma/prisma.service';
import { GeneratedPathStep } from '../ai/ai.schemas';
import { QuizWriterService } from '../ai/quiz-writer.service';
import { DocumentsService } from '../documents/documents.service';
import { QuizGenerationService } from '../quizzes/quiz-generation.service';
import { PATH_GENERATION_COST, TOPIC_OR_DOCUMENT_MESSAGE } from '../quizzes/quizzes.constants';
import { QuizzesService } from '../quizzes/quizzes.service';
import { NotificationsService } from '../realtime/notifications.service';
import { CreatePathDto } from './dto/create-path.dto';
import { PATH_PLAN, STEP_TIME_PER_QUESTION } from './learning-paths.constants';
import { buildStepRequests, earlierStepGoals } from './learning-paths.rules';
import { LearningPathsService } from './learning-paths.service';
import { PathDetail, PlannedStep } from './learning-paths.types';

@Injectable()
export class PathGenerationService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly quizWriter: QuizWriterService,
    private readonly documents: DocumentsService,
    private readonly quizzes: QuizzesService,
    private readonly generation: QuizGenerationService,
    private readonly notifications: NotificationsService,
    private readonly paths: LearningPathsService,
  ) {}

  createPath(userId: string, dto: CreatePathDto): Promise<PathDetail> {
    if (!dto.topic && !dto.documentId) {
      throw new BadRequestException(TOPIC_OR_DOCUMENT_MESSAGE);
    }
    return this.generation.runWithLimits(userId, PATH_GENERATION_COST, () =>
      this.writeAndSave(userId, dto),
    );
  }

  private async writeAndSave(userId: string, dto: CreatePathDto): Promise<PathDetail> {
    const context = dto.documentId ? await this.documents.getContext(userId, dto.documentId) : null;
    const steps = await this.writeSteps(userId, dto, context);
    const pathId = await this.savePath(userId, dto, steps);
    return this.paths.findDetail(userId, pathId);
  }

  // All five steps are written in parallel; if one fails, Promise.all fails and
  // nothing is saved.
  private writeSteps(
    userId: string,
    dto: CreatePathDto,
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
        const goals = earlierStepGoals(request.position);
        const step = await this.quizWriter.writePathStep(request, context, goals);
        done += 1;
        this.reportProgress(userId, done);
        return step;
      }),
    );
  }

  private savePath(
    userId: string,
    dto: CreatePathDto,
    steps: GeneratedPathStep[],
  ): Promise<string> {
    return this.prisma.$transaction(async (tx) => {
      const path = await tx.learningPath.create({
        data: {
          ownerId: userId,
          topic: dto.topic ?? steps[0].title,
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

import {
  BadRequestException,
  ConflictException,
  HttpException,
  HttpStatus,
  Injectable,
} from '@nestjs/common';
import { utcToday } from '../../common/utils/dates';
import { QuizRequest } from '../ai/ai.types';
import { QuizWriterService } from '../ai/quiz-writer.service';
import { DocumentsService } from '../documents/documents.service';
import { NotificationsService } from '../realtime/notifications.service';
import { GenerationStep } from '../realtime/realtime.types';
import { GenerateQuizDto } from './dto/generate-quiz.dto';
import {
  DAILY_AI_LIMIT,
  QUIZ_GENERATION_COST,
  TOPIC_OR_DOCUMENT_MESSAGE,
} from './quizzes.constants';
import { QuizzesService } from './quizzes.service';
import { QuizDetail } from './quizzes.types';

interface DailyUsage {
  day: number;
  used: number;
}

@Injectable()
export class QuizGenerationService {
  private readonly usersGenerating = new Set<string>();
  private readonly usageByUser = new Map<string, DailyUsage>();

  constructor(
    private readonly quizWriter: QuizWriterService,
    private readonly documents: DocumentsService,
    private readonly quizzes: QuizzesService,
    private readonly notifications: NotificationsService,
  ) {}

  generateQuiz(userId: string, dto: GenerateQuizDto): Promise<QuizDetail> {
    if (!dto.topic && !dto.documentId) {
      throw new BadRequestException(TOPIC_OR_DOCUMENT_MESSAGE);
    }
    return this.runWithLimits(userId, QUIZ_GENERATION_COST, () => this.writeAndSave(userId, dto));
  }

  /** Allows one generation per user at a time and DAILY_AI_LIMIT per UTC day. */
  async runWithLimits<T>(userId: string, cost: number, generate: () => Promise<T>): Promise<T> {
    if (this.usersGenerating.has(userId)) {
      throw new ConflictException("You're already creating something");
    }
    if (this.usedToday(userId) + cost > DAILY_AI_LIMIT) {
      throw new HttpException(
        'The quiz master needs a rest. Try again tomorrow!',
        HttpStatus.TOO_MANY_REQUESTS,
      );
    }

    this.usersGenerating.add(userId);
    try {
      const result = await generate();
      this.recordUsage(userId, cost);
      return result;
    } finally {
      this.usersGenerating.delete(userId);
    }
  }

  private async writeAndSave(userId: string, dto: GenerateQuizDto): Promise<QuizDetail> {
    this.reportProgress(userId, 'reading');
    const context = dto.documentId ? await this.documents.getContext(userId, dto.documentId) : null;
    const quiz = await this.quizWriter.writeQuiz(toQuizRequest(dto), context, (step) =>
      this.reportProgress(userId, step),
    );

    this.reportProgress(userId, 'saving');
    const quizId = await this.quizzes.saveGeneratedQuiz({
      ownerId: userId,
      kind: 'STANDARD',
      topic: dto.topic ?? quiz.title,
      documentId: dto.documentId ?? null,
      difficulty: dto.difficulty,
      audience: dto.audience,
      language: dto.language,
      timePerQuestion: dto.timePerQuestion,
      quiz,
    });
    this.reportProgress(userId, 'saving', 1);
    return this.quizzes.findDetail(userId, quizId);
  }

  private usedToday(userId: string): number {
    const usage = this.usageByUser.get(userId);
    return usage?.day === utcToday().getTime() ? usage.used : 0;
  }

  private recordUsage(userId: string, cost: number): void {
    const used = this.usedToday(userId) + cost;
    this.usageByUser.set(userId, { day: utcToday().getTime(), used });
  }

  private reportProgress(userId: string, step: GenerationStep, done = 0): void {
    this.notifications.emitToUser(userId, 'quiz:progress', { step, done, total: 1 });
  }
}

function toQuizRequest(dto: GenerateQuizDto): QuizRequest {
  return {
    topic: dto.topic ?? null,
    difficulty: dto.difficulty,
    audience: dto.audience,
    language: dto.language,
    questionCount: dto.questionCount,
  };
}

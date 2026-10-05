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

@Injectable()
export class QuizGenerationService {
  private readonly usersGenerating = new Set<string>();

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
    this.usersGenerating.add(userId);
    try {
      await this.assertDailyLimit(userId, cost);
      return await generate();
    } finally {
      this.usersGenerating.delete(userId);
    }
  }

  private async assertDailyLimit(userId: string, cost: number): Promise<void> {
    const usedToday = await this.quizzes.countGeneratedSince(userId, utcToday());
    if (usedToday + cost > DAILY_AI_LIMIT) {
      throw new HttpException(
        'The quiz master needs a rest. Try again tomorrow!',
        HttpStatus.TOO_MANY_REQUESTS,
      );
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

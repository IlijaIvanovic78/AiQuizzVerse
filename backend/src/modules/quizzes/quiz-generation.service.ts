import { BadRequestException, Injectable } from '@nestjs/common';
import { QuizRequest } from '../ai/ai.types';
import { QuizWriterService } from '../ai/quiz-writer.service';
import { DocumentsService } from '../documents/documents.service';
import { NotificationsService } from '../realtime/notifications.service';
import { GenerationStep } from '../realtime/realtime.types';
import { GenerateQuizDto } from './dto/generate-quiz.dto';
import { GenerationLimitsService } from './generation-limits.service';
import { QUIZ_GENERATION_COST, TOPIC_OR_DOCUMENT_MESSAGE } from './quizzes.constants';
import { QuizzesService } from './quizzes.service';
import { QuizDetail } from './quizzes.types';

@Injectable()
export class QuizGenerationService {
  constructor(
    private readonly quizWriter: QuizWriterService,
    private readonly documents: DocumentsService,
    private readonly quizzes: QuizzesService,
    private readonly limits: GenerationLimitsService,
    private readonly notifications: NotificationsService,
  ) {}

  async generateQuiz(userId: string, dto: GenerateQuizDto): Promise<QuizDetail> {
    if (!dto.topic && !dto.documentId) {
      throw new BadRequestException(TOPIC_OR_DOCUMENT_MESSAGE);
    }
    return this.limits.runWithLimits(userId, QUIZ_GENERATION_COST, () =>
      this.writeAndSave(userId, dto),
    );
  }

  private async writeAndSave(userId: string, dto: GenerateQuizDto): Promise<QuizDetail> {
    this.reportProgress(userId, 'reading');
    const lesson = dto.documentId ? await this.documents.getLesson(userId, dto.documentId) : null;
    const context = lesson?.context ?? null;
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

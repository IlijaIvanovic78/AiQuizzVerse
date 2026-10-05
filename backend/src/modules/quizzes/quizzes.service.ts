import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { toQuizCopy } from './quiz.mapper';
import { STARTER_QUIZ_IDS } from './quizzes.constants';

@Injectable()
export class QuizzesService {
  constructor(private readonly prisma: PrismaService) {}

  async copyStarterQuizzes(userId: string): Promise<void> {
    const starters = await this.prisma.quiz.findMany({
      where: { id: { in: STARTER_QUIZ_IDS } },
      include: { questions: { orderBy: { position: 'asc' } } },
    });
    await this.prisma.$transaction(
      starters.map((quiz) => this.prisma.quiz.create({ data: toQuizCopy(quiz, userId) })),
    );
  }
}

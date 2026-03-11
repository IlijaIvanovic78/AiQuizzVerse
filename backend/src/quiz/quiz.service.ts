import { Injectable, NotFoundException, ForbiddenException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class QuizService {
  constructor(private readonly prisma: PrismaService) {}

  async findAllByUser(userId: string) {
    return this.prisma.quiz.findMany({
      where: { createdById: userId },
      orderBy: { createdAt: 'desc' },
      include: {
        _count: { select: { questions: true } },
      },
    });
  }

  async findOne(quizId: string) {
    const quiz = await this.prisma.quiz.findUnique({
      where: { id: quizId },
      include: { questions: true },
    });

    if (!quiz) {
      throw new NotFoundException('Quiz not found');
    }

    return quiz;
  }

  async delete(quizId: string, userId: string) {
    const quiz = await this.prisma.quiz.findUnique({
      where: { id: quizId },
    });

    if (!quiz) {
      throw new NotFoundException('Quiz not found');
    }

    if (quiz.createdById !== userId) {
      throw new ForbiddenException('You can only delete your own quizzes');
    }

    await this.prisma.quiz.delete({ where: { id: quizId } });

    return { message: 'Quiz deleted successfully' };
  }
}

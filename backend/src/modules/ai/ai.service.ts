import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { PrismaService } from '../../infrastructure/prisma/prisma.service';
import { RetrieverService } from './rag/retriever.service';
import { createQuizGeneratorGraph } from './graph/quiz-generator.graph';
import { GenerateQuizDto } from './dto';
import { Difficulty, QuizTheme } from '@prisma/client';

@Injectable()
export class AiService {
  private readonly logger = new Logger(AiService.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly configService: ConfigService,
    private readonly retrieverService: RetrieverService,
  ) {}

  async generateQuiz(dto: GenerateQuizDto, userId: string) {
    const openAIApiKey = this.configService.get<string>('OPENAI_API_KEY')!;
    const graph = createQuizGeneratorGraph(this.retrieverService, openAIApiKey);

    this.logger.log(
      `Generating quiz: topic="${dto.topic}", difficulty=${dto.difficulty}, questions=${dto.numQuestions}`,
    );

    const result = await graph.invoke({
      topic: dto.topic,
      difficulty: dto.difficulty,
      numQuestions: dto.numQuestions,
      timePerQuestion: dto.timePerQuestion,
      sourceType: dto.sourceType,
      userId,
      context: '',
      questions: [],
      feedback: '',
      iteration: 0,
      status: 'retrieving',
    });

    if (!result.questions || result.questions.length === 0) {
      throw new Error(
        'AI failed to generate quiz questions. Please try again.',
      );
    }

    const theme = this.inferTheme(dto.topic);

    const quiz = await this.prisma.quiz.create({
      data: {
        title: `Quiz: ${dto.topic}`,
        theme,
        difficulty: dto.difficulty,
        numQuestions: result.questions.length,
        timePerQuestion: dto.timePerQuestion,
        sourceType: dto.sourceType,
        createdById: userId,
        questions: {
          create: result.questions.map((q) => ({
            text: q.text,
            options: q.options,
            correctAnswer: q.correctAnswer,
            explanation: q.explanation || null,
          })),
        },
      },
      include: { questions: true },
    });

    this.logger.log(
      `Quiz created: id=${quiz.id}, questions=${quiz.questions.length}`,
    );
    return quiz;
  }

  private inferTheme(topic: string): QuizTheme {
    const lower = topic.toLowerCase();
    const themeMap: [string[], QuizTheme][] = [
      [
        [
          'space',
          'planet',
          'solar',
          'galaxy',
          'star',
          'astro',
          'nasa',
          'cosmos',
        ],
        'SPACE',
      ],
      [
        [
          'history',
          'war',
          'ancient',
          'medieval',
          'century',
          'empire',
          'revolution',
        ],
        'HISTORY',
      ],
      [
        [
          'programming',
          'code',
          'javascript',
          'python',
          'software',
          'algorithm',
          'web',
          'react',
          'angular',
          'typescript',
        ],
        'PROGRAMMING',
      ],
      [
        [
          'science',
          'physics',
          'chemistry',
          'biology',
          'atom',
          'molecule',
          'cell',
        ],
        'SCIENCE',
      ],
      [
        [
          'geography',
          'country',
          'capital',
          'continent',
          'ocean',
          'river',
          'mountain',
        ],
        'GEOGRAPHY',
      ],
      [
        [
          'literature',
          'book',
          'author',
          'novel',
          'poem',
          'shakespeare',
          'writing',
        ],
        'LITERATURE',
      ],
      [
        [
          'math',
          'algebra',
          'geometry',
          'calculus',
          'equation',
          'number',
          'theorem',
        ],
        'MATH',
      ],
    ];

    for (const [keywords, theme] of themeMap) {
      if (keywords.some((kw) => lower.includes(kw))) {
        return theme;
      }
    }
    return 'GENERAL';
  }
}

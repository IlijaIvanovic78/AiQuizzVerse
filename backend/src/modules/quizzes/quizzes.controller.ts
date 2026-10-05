import {
  Body,
  Controller,
  Delete,
  Get,
  HttpCode,
  HttpStatus,
  Param,
  ParseUUIDPipe,
  Patch,
  Post,
  Put,
  UseGuards,
} from '@nestjs/common';
import { ApiBearerAuth, ApiTags } from '@nestjs/swagger';
import { CurrentUserId } from '../auth/decorators/current-user-id.decorator';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { CreateQuizDto } from './dto/create-quiz.dto';
import { GenerateQuizDto } from './dto/generate-quiz.dto';
import { QuestionInputDto } from './dto/question-input.dto';
import { UpdateQuizDto } from './dto/update-quiz.dto';
import { QuizGenerationService } from './quiz-generation.service';
import { QuizzesService } from './quizzes.service';
import { QuestionView, QuizDetail, QuizSummary } from './quizzes.types';

@ApiTags('Quizzes')
@ApiBearerAuth('access-token')
@UseGuards(JwtAuthGuard)
@Controller('quizzes')
export class QuizzesController {
  constructor(
    private readonly quizzes: QuizzesService,
    private readonly generation: QuizGenerationService,
  ) {}

  @Get()
  findMine(@CurrentUserId() userId: string): Promise<QuizSummary[]> {
    return this.quizzes.findMine(userId);
  }

  @Get('featured')
  findFeatured(@CurrentUserId() userId: string): Promise<QuizSummary[]> {
    return this.quizzes.findFeatured(userId);
  }

  @Post()
  create(@CurrentUserId() userId: string, @Body() dto: CreateQuizDto): Promise<QuizDetail> {
    return this.quizzes.create(userId, dto);
  }

  @Post('generate')
  generate(@CurrentUserId() userId: string, @Body() dto: GenerateQuizDto): Promise<QuizDetail> {
    return this.generation.generateQuiz(userId, dto);
  }

  @Get(':id')
  findOne(@CurrentUserId() userId: string, @Param('id') quizId: string): Promise<QuizDetail> {
    return this.quizzes.findDetail(userId, quizId);
  }

  @Patch(':id')
  update(
    @CurrentUserId() userId: string,
    @Param('id') quizId: string,
    @Body() dto: UpdateQuizDto,
  ): Promise<QuizDetail> {
    return this.quizzes.update(userId, quizId, dto);
  }

  @Delete(':id')
  @HttpCode(HttpStatus.NO_CONTENT)
  remove(@CurrentUserId() userId: string, @Param('id') quizId: string): Promise<void> {
    return this.quizzes.remove(userId, quizId);
  }

  @Post(':id/questions')
  addQuestion(
    @CurrentUserId() userId: string,
    @Param('id') quizId: string,
    @Body() dto: QuestionInputDto,
  ): Promise<QuestionView> {
    return this.quizzes.addQuestion(userId, quizId, dto);
  }

  @Put(':id/questions/:questionId')
  updateQuestion(
    @CurrentUserId() userId: string,
    @Param('id') quizId: string,
    @Param('questionId', ParseUUIDPipe) questionId: string,
    @Body() dto: QuestionInputDto,
  ): Promise<QuestionView> {
    return this.quizzes.updateQuestion(userId, quizId, questionId, dto);
  }

  @Delete(':id/questions/:questionId')
  @HttpCode(HttpStatus.NO_CONTENT)
  removeQuestion(
    @CurrentUserId() userId: string,
    @Param('id') quizId: string,
    @Param('questionId', ParseUUIDPipe) questionId: string,
  ): Promise<void> {
    return this.quizzes.removeQuestion(userId, quizId, questionId);
  }
}

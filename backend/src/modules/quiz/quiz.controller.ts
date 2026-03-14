import {
  Controller,
  Get,
  Delete,
  Param,
  UseGuards,
  HttpCode,
  HttpStatus,
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiBearerAuth, ApiParam } from '@nestjs/swagger';
import { QuizService } from './quiz.service';
import { JwtAuthGuard } from '../../shared/guards/jwt-auth.guard';
import { CurrentUser } from '../../shared/decorators/current-user.decorator';

@ApiTags('Quizzes')
@Controller('quizzes')
@UseGuards(JwtAuthGuard)
@ApiBearerAuth('access-token')
export class QuizController {
  constructor(private readonly quizService: QuizService) {}

  @Get()
  @ApiOperation({ summary: 'Get all quizzes created by current user' })
  @ApiResponse({ status: 200, description: 'List of user quizzes' })
  async getMyQuizzes(@CurrentUser('userId') userId: string) {
    return this.quizService.findAllByUser(userId);
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get quiz details with questions' })
  @ApiParam({ name: 'id', description: 'Quiz ID' })
  @ApiResponse({ status: 200, description: 'Quiz with questions' })
  @ApiResponse({ status: 404, description: 'Quiz not found' })
  async getQuizDetail(@Param('id') id: string) {
    return this.quizService.findOne(id);
  }

  @Delete(':id')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Delete a quiz (owner only)' })
  @ApiParam({ name: 'id', description: 'Quiz ID' })
  @ApiResponse({ status: 200, description: 'Quiz deleted' })
  @ApiResponse({ status: 403, description: 'Not the owner' })
  @ApiResponse({ status: 404, description: 'Quiz not found' })
  async deleteQuiz(
    @CurrentUser('userId') userId: string,
    @Param('id') id: string,
  ) {
    return this.quizService.delete(id, userId);
  }
}

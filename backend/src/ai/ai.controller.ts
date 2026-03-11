import {
  Controller,
  Post,
  Body,
  UseGuards,
  HttpCode,
  HttpStatus,
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiBearerAuth } from '@nestjs/swagger';
import { AiService } from './ai.service';
import { GenerateQuizDto } from './dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { CurrentUser } from '../auth/decorators/current-user.decorator';

@ApiTags('AI')
@Controller('ai')
@UseGuards(JwtAuthGuard)
@ApiBearerAuth('access-token')
export class AiController {
  constructor(private readonly aiService: AiService) {}

  @Post('generate-quiz')
  @HttpCode(HttpStatus.CREATED)
  @ApiOperation({ summary: 'Generate a quiz using AI (LangGraph: retriever → generator → critic)' })
  @ApiResponse({ status: 201, description: 'Quiz generated and saved' })
  @ApiResponse({ status: 400, description: 'Invalid input or generation failed' })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  async generateQuiz(
    @CurrentUser('userId') userId: string,
    @Body() dto: GenerateQuizDto,
  ) {
    return this.aiService.generateQuiz(dto, userId);
  }
}

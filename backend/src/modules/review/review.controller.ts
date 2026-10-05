import { Body, Controller, Get, Post, UseGuards } from '@nestjs/common';
import { ApiBearerAuth, ApiTags } from '@nestjs/swagger';
import { CurrentUserId } from '../auth/decorators/current-user.decorator';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { PracticeDto } from './dto/practice.dto';
import { ReviewService } from './review.service';
import { PracticeQuiz, ReviewDeck } from './review.types';

@ApiTags('Review')
@ApiBearerAuth('access-token')
@UseGuards(JwtAuthGuard)
@Controller('review')
export class ReviewController {
  constructor(private readonly review: ReviewService) {}

  @Get()
  findDeck(@CurrentUserId() userId: string): Promise<ReviewDeck> {
    return this.review.findDeck(userId);
  }

  @Post('practice')
  startPractice(@CurrentUserId() userId: string, @Body() dto: PracticeDto): Promise<PracticeQuiz> {
    return this.review.startPractice(userId, dto);
  }
}

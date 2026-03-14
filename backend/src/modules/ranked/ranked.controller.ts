import {
  Controller,
  Get,
  Post,
  Body,
  Param,
  UseGuards,
} from '@nestjs/common';
import { JwtAuthGuard } from '../../shared/guards/jwt-auth.guard';
import { CurrentUser } from '../../shared/decorators/current-user.decorator';
import { RankedService } from './ranked.service';
import { CreateJourneyDto, CompleteStageDto } from './dto';

@Controller('ranked')
@UseGuards(JwtAuthGuard)
export class RankedController {
  constructor(private readonly rankedService: RankedService) {}

  @Post('journey')
  createJourney(
    @CurrentUser('userId') userId: string,
    @Body() dto: CreateJourneyDto,
  ) {
    return this.rankedService.createJourney(userId, dto.topic, dto.totalStages);
  }

  @Get('journeys')
  getJourneys(@CurrentUser('userId') userId: string) {
    return this.rankedService.getJourneys(userId);
  }

  @Get('journey/:id')
  getJourney(
    @CurrentUser('userId') userId: string,
    @Param('id') id: string,
  ) {
    return this.rankedService.getJourney(id, userId);
  }

  @Post('journey/:journeyId/stage/:stageId/complete')
  completeStage(
    @CurrentUser('userId') userId: string,
    @Param('journeyId') journeyId: string,
    @Param('stageId') stageId: string,
    @Body() dto: CompleteStageDto,
  ) {
    return this.rankedService.completeStage(journeyId, stageId, userId, dto.score);
  }
}

import {
  Body,
  Controller,
  Delete,
  Get,
  HttpCode,
  HttpStatus,
  Param,
  ParseUUIDPipe,
  Post,
  UseGuards,
} from '@nestjs/common';
import { ApiBearerAuth, ApiTags } from '@nestjs/swagger';
import { CurrentUserId } from '../auth/decorators/current-user.decorator';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { CreatePathDto } from './dto/create-path.dto';
import { LearningPathsService } from './learning-paths.service';
import { PathDetail, PathSummary } from './learning-paths.types';
import { PathGenerationService } from './path-generation.service';

@ApiTags('Learning paths')
@ApiBearerAuth('access-token')
@UseGuards(JwtAuthGuard)
@Controller('paths')
export class LearningPathsController {
  constructor(
    private readonly paths: LearningPathsService,
    private readonly generation: PathGenerationService,
  ) {}

  @Post()
  create(@CurrentUserId() userId: string, @Body() dto: CreatePathDto): Promise<PathDetail> {
    return this.generation.createPath(userId, dto);
  }

  @Get()
  findAll(@CurrentUserId() userId: string): Promise<PathSummary[]> {
    return this.paths.findAll(userId);
  }

  @Get(':id')
  findOne(
    @CurrentUserId() userId: string,
    @Param('id', ParseUUIDPipe) pathId: string,
  ): Promise<PathDetail> {
    return this.paths.findDetail(userId, pathId);
  }

  @Delete(':id')
  @HttpCode(HttpStatus.NO_CONTENT)
  remove(
    @CurrentUserId() userId: string,
    @Param('id', ParseUUIDPipe) pathId: string,
  ): Promise<void> {
    return this.paths.remove(userId, pathId);
  }
}

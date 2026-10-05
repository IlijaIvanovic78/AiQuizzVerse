import {
  Controller,
  Get,
  HttpCode,
  HttpStatus,
  Param,
  ParseUUIDPipe,
  Post,
  UseGuards,
} from '@nestjs/common';
import { ApiBearerAuth, ApiTags } from '@nestjs/swagger';
import { CurrentUserId } from '../auth/decorators/current-user-id.decorator';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { ChestsService } from './chests.service';
import type { ChestList, ChestOdds, OpenedChest } from './chests.types';

@ApiTags('Chests')
@ApiBearerAuth('access-token')
@UseGuards(JwtAuthGuard)
@Controller('chests')
export class ChestsController {
  constructor(private readonly chests: ChestsService) {}

  @Get()
  findAll(@CurrentUserId() userId: string): Promise<ChestList> {
    return this.chests.findAll(userId);
  }

  @Get('odds')
  findOdds(): ChestOdds {
    return this.chests.findOdds();
  }

  @Post(':id/open')
  @HttpCode(HttpStatus.OK)
  open(
    @CurrentUserId() userId: string,
    @Param('id', ParseUUIDPipe) chestId: string,
  ): Promise<OpenedChest> {
    return this.chests.open(userId, chestId);
  }
}

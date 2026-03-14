import {
  Controller,
  Post,
  Get,
  Body,
  Param,
  UseGuards,
  HttpCode,
  HttpStatus,
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiBearerAuth, ApiParam } from '@nestjs/swagger';
import { GameService } from './game.service';
import { JwtAuthGuard } from '../../shared/guards/jwt-auth.guard';
import { CurrentUser } from '../../shared/decorators/current-user.decorator';
import { CreateMatchDto, JoinMatchDto } from './dto';

@ApiTags('Game')
@Controller('game')
@UseGuards(JwtAuthGuard)
@ApiBearerAuth('access-token')
export class GameController {
  constructor(private readonly gameService: GameService) {}

  @Post('match')
  @ApiOperation({ summary: 'Create a new match (solo, pvp, or coop)' })
  @ApiResponse({ status: 201, description: 'Match created' })
  async createMatch(
    @CurrentUser('userId') userId: string,
    @Body() dto: CreateMatchDto,
  ) {
    return this.gameService.createMatch(userId, dto.quizId, dto.type);
  }

  @Post('join')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Join match via invite code' })
  @ApiResponse({ status: 200, description: 'Joined match' })
  @ApiResponse({ status: 404, description: 'Match not found' })
  async joinMatch(
    @CurrentUser('userId') userId: string,
    @Body() dto: JoinMatchDto,
  ) {
    return this.gameService.joinMatch(userId, dto.inviteCode);
  }

  @Get('match/:id')
  @ApiOperation({ summary: 'Get match details' })
  @ApiParam({ name: 'id', description: 'Match ID' })
  @ApiResponse({ status: 200, description: 'Match details' })
  async getMatch(@Param('id') id: string) {
    return this.gameService.getMatch(id);
  }

  @Get('history')
  @ApiOperation({ summary: 'Get current user match history' })
  @ApiResponse({ status: 200, description: 'Match history' })
  async getHistory(@CurrentUser('userId') userId: string) {
    return this.gameService.getHistory(userId);
  }
}

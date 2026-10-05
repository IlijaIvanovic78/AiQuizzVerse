import {
  Body,
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
import { CreateMatchDto } from './dto/create-match.dto';
import { InviteFriendDto } from './dto/invite-friend.dto';
import { JoinMatchDto } from './dto/join-match.dto';
import { MatchResultsService } from './match-results.service';
import { MatchesService } from './matches.service';
import { MatchHistoryEntry, MatchResult, MatchView } from './matches.types';

@ApiTags('Matches')
@ApiBearerAuth('access-token')
@UseGuards(JwtAuthGuard)
@Controller('matches')
export class MatchesController {
  constructor(
    private readonly matches: MatchesService,
    private readonly results: MatchResultsService,
  ) {}

  @Post()
  create(@CurrentUserId() userId: string, @Body() dto: CreateMatchDto): Promise<MatchView> {
    return this.matches.create(userId, dto);
  }

  @Post('join')
  @HttpCode(HttpStatus.OK)
  join(@CurrentUserId() userId: string, @Body() dto: JoinMatchDto): Promise<MatchView> {
    return this.matches.join(userId, dto.inviteCode);
  }

  @Get('history')
  history(@CurrentUserId() userId: string): Promise<MatchHistoryEntry[]> {
    return this.matches.history(userId);
  }

  @Get(':id')
  findOne(
    @CurrentUserId() userId: string,
    @Param('id', ParseUUIDPipe) id: string,
  ): Promise<MatchView> {
    return this.matches.getView(id, userId);
  }

  @Get(':id/result')
  result(
    @CurrentUserId() userId: string,
    @Param('id', ParseUUIDPipe) id: string,
  ): Promise<MatchResult> {
    return this.results.findResult(id, userId);
  }

  @Post(':id/invite')
  @HttpCode(HttpStatus.NO_CONTENT)
  invite(
    @CurrentUserId() userId: string,
    @Param('id', ParseUUIDPipe) id: string,
    @Body() dto: InviteFriendDto,
  ): Promise<void> {
    return this.matches.invite(id, userId, dto.friendId);
  }

  @Post(':id/rematch')
  rematch(
    @CurrentUserId() userId: string,
    @Param('id', ParseUUIDPipe) id: string,
  ): Promise<MatchView> {
    return this.matches.rematch(id, userId);
  }
}

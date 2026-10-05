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
  Query,
  UseGuards,
} from '@nestjs/common';
import { ApiBearerAuth, ApiTags } from '@nestjs/swagger';
import { CurrentUserId } from '../auth/decorators/current-user-id.decorator';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { SearchUsersDto } from './dto/search-users.dto';
import { SendFriendRequestDto } from './dto/send-friend-request.dto';
import { FriendsService } from './friends.service';
import { Friend, FriendRequestOutcome, FriendRequests, UserSearchResult } from './friends.types';

@ApiTags('Friends')
@ApiBearerAuth('access-token')
@UseGuards(JwtAuthGuard)
@Controller('friends')
export class FriendsController {
  constructor(private readonly friends: FriendsService) {}

  @Get()
  list(@CurrentUserId() userId: string): Promise<Friend[]> {
    return this.friends.listFriends(userId);
  }

  @Get('requests')
  listRequests(@CurrentUserId() userId: string): Promise<FriendRequests> {
    return this.friends.listRequests(userId);
  }

  @Get('search')
  search(
    @CurrentUserId() userId: string,
    @Query() query: SearchUsersDto,
  ): Promise<UserSearchResult[]> {
    return this.friends.search(userId, query.q);
  }

  @Post('requests')
  sendRequest(
    @CurrentUserId() userId: string,
    @Body() dto: SendFriendRequestDto,
  ): Promise<FriendRequestOutcome> {
    return this.friends.sendRequest(userId, dto.userId);
  }

  @Post('requests/:id/accept')
  @HttpCode(HttpStatus.OK)
  acceptRequest(
    @CurrentUserId() userId: string,
    @Param('id', ParseUUIDPipe) requestId: string,
  ): Promise<Friend> {
    return this.friends.acceptRequest(userId, requestId);
  }

  @Delete('requests/:id')
  @HttpCode(HttpStatus.NO_CONTENT)
  removeRequest(
    @CurrentUserId() userId: string,
    @Param('id', ParseUUIDPipe) requestId: string,
  ): Promise<void> {
    return this.friends.removeRequest(userId, requestId);
  }

  @Delete(':friendshipId')
  @HttpCode(HttpStatus.NO_CONTENT)
  removeFriend(
    @CurrentUserId() userId: string,
    @Param('friendshipId', ParseUUIDPipe) friendshipId: string,
  ): Promise<void> {
    return this.friends.removeFriend(userId, friendshipId);
  }
}

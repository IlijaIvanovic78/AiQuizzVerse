import {
  Controller,
  Get,
  Post,
  Delete,
  Param,
  Query,
  UseGuards,
  HttpCode,
  HttpStatus,
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiBearerAuth, ApiParam, ApiQuery } from '@nestjs/swagger';
import { FriendshipService } from './friendship.service';
import { SearchUsersQueryDto } from './dto';
import { JwtAuthGuard } from '../../shared/guards/jwt-auth.guard';
import { CurrentUser } from '../../shared/decorators/current-user.decorator';

@ApiTags('Friends')
@Controller('friends')
@UseGuards(JwtAuthGuard)
@ApiBearerAuth('JWT-auth')
export class FriendshipController {
  constructor(private readonly friendshipService: FriendshipService) {}

  @Post('request/:userId')
  @HttpCode(HttpStatus.CREATED)
  @ApiOperation({ summary: 'Send friend request' })
  @ApiParam({ name: 'userId', description: 'ID of user to send request to' })
  @ApiResponse({ status: 201, description: 'Friend request sent' })
  @ApiResponse({ status: 400, description: 'Already friends or request already sent' })
  @ApiResponse({ status: 404, description: 'User not found' })
  async sendRequest(
    @CurrentUser('userId') senderId: string,
    @Param('userId') receiverId: string,
  ) {
    return this.friendshipService.sendRequest(senderId, receiverId);
  }

  @Post('accept/:friendshipId')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Accept friend request' })
  @ApiParam({ name: 'friendshipId', description: 'ID of friendship to accept' })
  @ApiResponse({ status: 200, description: 'Friend request accepted' })
  @ApiResponse({ status: 403, description: 'Can only accept requests sent to you' })
  @ApiResponse({ status: 404, description: 'Friend request not found' })
  async acceptRequest(
    @CurrentUser('userId') userId: string,
    @Param('friendshipId') friendshipId: string,
  ) {
    return this.friendshipService.acceptRequest(friendshipId, userId);
  }

  @Post('reject/:friendshipId')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Reject friend request' })
  @ApiParam({ name: 'friendshipId', description: 'ID of friendship to reject' })
  @ApiResponse({ status: 200, description: 'Friend request rejected' })
  @ApiResponse({ status: 403, description: 'Can only reject requests sent to you' })
  @ApiResponse({ status: 404, description: 'Friend request not found' })
  async rejectRequest(
    @CurrentUser('userId') userId: string,
    @Param('friendshipId') friendshipId: string,
  ) {
    return this.friendshipService.rejectRequest(friendshipId, userId);
  }

  @Delete(':friendshipId')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Remove friend' })
  @ApiParam({ name: 'friendshipId', description: 'ID of friendship to remove' })
  @ApiResponse({ status: 200, description: 'Friend removed' })
  @ApiResponse({ status: 403, description: 'Can only remove your own friendships' })
  @ApiResponse({ status: 404, description: 'Friendship not found' })
  async removeFriend(
    @CurrentUser('userId') userId: string,
    @Param('friendshipId') friendshipId: string,
  ) {
    return this.friendshipService.removeFriend(friendshipId, userId);
  }

  @Get()
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Get list of friends' })
  @ApiResponse({ status: 200, description: 'Returns list of accepted friends' })
  async getFriends(@CurrentUser('userId') userId: string) {
    return this.friendshipService.getFriends(userId);
  }

  @Get('pending')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Get pending friend requests (incoming)' })
  @ApiResponse({ status: 200, description: 'Returns list of pending requests sent to you' })
  async getPendingRequests(@CurrentUser('userId') userId: string) {
    return this.friendshipService.getPendingRequests(userId);
  }

  @Get('sent')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Get sent friend requests (outgoing)' })
  @ApiResponse({ status: 200, description: 'Returns list of pending requests you sent' })
  async getSentRequests(@CurrentUser('userId') userId: string) {
    return this.friendshipService.getSentRequests(userId);
  }

  @Get('search')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Search users by username' })
  @ApiQuery({ name: 'q', description: 'Search query (username)', required: true })
  @ApiResponse({ status: 200, description: 'Returns list of users matching search' })
  async searchUsers(
    @CurrentUser('userId') userId: string,
    @Query() query: SearchUsersQueryDto,
  ) {
    return this.friendshipService.searchUsers(query.q, userId);
  }
}

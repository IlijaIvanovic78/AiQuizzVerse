import {
  Controller,
  Get,
  Post,
  Param,
  Body,
  UseGuards,
} from '@nestjs/common';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { CurrentUser } from '../auth/decorators/current-user.decorator';
import { AvatarService } from './avatar.service';

@Controller('avatar')
@UseGuards(JwtAuthGuard)
export class AvatarController {
  constructor(private readonly avatarService: AvatarService) {}

  @Get('items')
  getMyItems(@CurrentUser('userId') userId: string) {
    return this.avatarService.getUserItems(userId);
  }

  @Get('equipped')
  getEquipped(@CurrentUser('userId') userId: string) {
    return this.avatarService.getEquipped(userId);
  }

  @Get('starters')
  getStarters() {
    return this.avatarService.getStarters();
  }

  @Post('select/:userItemId')
  selectAvatar(
    @CurrentUser('userId') userId: string,
    @Param('userItemId') userItemId: string,
  ) {
    return this.avatarService.selectAvatar(userId, userItemId);
  }

  @Post('select-starter')
  selectStarter(
    @CurrentUser('userId') userId: string,
    @Body('itemId') itemId: string,
  ) {
    return this.avatarService.selectStarter(userId, itemId);
  }
}

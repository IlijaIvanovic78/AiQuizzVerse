import { Body, Controller, Get, Param, Patch, UseGuards } from '@nestjs/common';
import { ApiBearerAuth, ApiTags } from '@nestjs/swagger';
import { CurrentUserId } from '../auth/decorators/current-user-id.decorator';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { CurrentUser } from '../users/users.types';
import { UpdateProfileDto } from './dto/update-profile.dto';
import { ProfileService } from './profile.service';
import { ProfileView } from './profile.types';

@ApiTags('Profile')
@ApiBearerAuth('access-token')
@UseGuards(JwtAuthGuard)
@Controller('profile')
export class ProfileController {
  constructor(private readonly profile: ProfileService) {}

  @Get('me')
  getOwnProfile(@CurrentUserId() userId: string): Promise<ProfileView> {
    return this.profile.getOwnProfile(userId);
  }

  @Patch('me')
  rename(@CurrentUserId() userId: string, @Body() dto: UpdateProfileDto): Promise<CurrentUser> {
    return this.profile.rename(userId, dto.username);
  }

  @Get(':username')
  getProfile(
    @CurrentUserId() userId: string,
    @Param('username') username: string,
  ): Promise<ProfileView> {
    return this.profile.getProfile(userId, username);
  }
}

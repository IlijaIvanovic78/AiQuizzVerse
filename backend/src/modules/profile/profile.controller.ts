import {
  Body,
  Controller,
  Delete,
  Get,
  HttpCode,
  HttpStatus,
  Param,
  Patch,
  Post,
  UseGuards,
} from '@nestjs/common';
import { ApiBearerAuth, ApiTags } from '@nestjs/swagger';
import { CurrentUserId } from '../auth/decorators/current-user-id.decorator';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { CurrentUser } from '../users/users.types';
import { UpdateProfileDto } from './dto/update-profile.dto';
import { EquipmentService } from './equipment.service';
import { ProfileService } from './profile.service';
import { ProfileView } from './profile.types';

@ApiTags('Profile')
@ApiBearerAuth('access-token')
@UseGuards(JwtAuthGuard)
@Controller('profile')
export class ProfileController {
  constructor(
    private readonly profile: ProfileService,
    private readonly equipment: EquipmentService,
  ) {}

  @Get('me')
  getOwnProfile(@CurrentUserId() userId: string): Promise<ProfileView> {
    return this.profile.getOwnProfile(userId);
  }

  @Patch('me')
  rename(@CurrentUserId() userId: string, @Body() dto: UpdateProfileDto): Promise<CurrentUser> {
    return this.profile.rename(userId, dto.username);
  }

  @Post('me/equipment/:itemId')
  @HttpCode(HttpStatus.OK)
  equip(@CurrentUserId() userId: string, @Param('itemId') itemId: string): Promise<CurrentUser> {
    return this.equipment.equip(userId, itemId);
  }

  @Delete('me/equipment/pet')
  unequipPet(@CurrentUserId() userId: string): Promise<CurrentUser> {
    return this.equipment.unequipPet(userId);
  }

  @Get(':username')
  getProfile(
    @CurrentUserId() userId: string,
    @Param('username') username: string,
  ): Promise<ProfileView> {
    return this.profile.getProfile(userId, username);
  }
}

import {
  Controller,
  Get,
  Post,
  Delete,
  Param,
  Body,
  UseGuards,
} from '@nestjs/common';
import { JwtAuthGuard } from '../../shared/guards/jwt-auth.guard';
import { CurrentUser } from '../../shared/decorators/current-user.decorator';
import { AvatarService } from './avatar.service';
import { SelectStarterDto } from './dto/select-starter.dto';

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
    @Body() dto: SelectStarterDto,
  ) {
    return this.avatarService.selectStarter(userId, dto.itemId);
  }

  @Get('pets')
  getMyPets(@CurrentUser('userId') userId: string) {
    return this.avatarService.getUserPets(userId);
  }

  @Get('pets/equipped')
  getEquippedPet(@CurrentUser('userId') userId: string) {
    return this.avatarService.getEquippedPet(userId);
  }

  @Post('pets/select/:userItemId')
  selectPet(
    @CurrentUser('userId') userId: string,
    @Param('userItemId') userItemId: string,
  ) {
    return this.avatarService.selectPet(userId, userItemId);
  }

  @Delete('pets/unequip')
  unequipPet(@CurrentUser('userId') userId: string) {
    return this.avatarService.unequipPet(userId);
  }
}

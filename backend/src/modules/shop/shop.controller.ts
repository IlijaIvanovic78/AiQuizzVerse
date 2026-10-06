import {
  Controller,
  Get,
  HttpCode,
  HttpStatus,
  Param,
  ParseEnumPipe,
  Post,
  UseGuards,
} from '@nestjs/common';
import { ApiBearerAuth, ApiTags } from '@nestjs/swagger';
import { BoostType } from '@prisma/client';
import { CurrentUserId } from '../auth/decorators/current-user-id.decorator';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { CurrentUser } from '../users/users.types';
import { ShopService } from './shop.service';
import { BoostOffer, BoostPurchase, ItemPurchase, ShopItem } from './shop.types';

@ApiTags('Shop')
@ApiBearerAuth('access-token')
@UseGuards(JwtAuthGuard)
@Controller('shop')
export class ShopController {
  constructor(private readonly shop: ShopService) {}

  @Get('items')
  listItems(@CurrentUserId() userId: string): Promise<ShopItem[]> {
    return this.shop.listItems(userId);
  }

  @Post('items/:id/buy')
  buyItem(@CurrentUserId() userId: string, @Param('id') itemId: string): Promise<ItemPurchase> {
    return this.shop.buyItem(userId, itemId);
  }

  @Post('starters/:id/claim')
  @HttpCode(HttpStatus.OK)
  claimStarter(@CurrentUserId() userId: string, @Param('id') itemId: string): Promise<CurrentUser> {
    return this.shop.claimStarter(userId, itemId);
  }

  @Get('boosts')
  listBoosts(@CurrentUserId() userId: string): Promise<BoostOffer[]> {
    return this.shop.listBoosts(userId);
  }

  @Post('boosts/:type/buy')
  buyBoost(
    @CurrentUserId() userId: string,
    @Param('type', new ParseEnumPipe(BoostType)) type: BoostType,
  ): Promise<BoostPurchase> {
    return this.shop.buyBoost(userId, type);
  }
}

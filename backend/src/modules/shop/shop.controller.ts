import {
  Controller,
  Get,
  Post,
  Body,
  Query,
  UseGuards,
} from '@nestjs/common';
import { JwtAuthGuard } from '../../shared/guards/jwt-auth.guard';
import { CurrentUser } from '../../shared/decorators/current-user.decorator';
import { ShopService } from './shop.service';
import { BuyItemDto, BuyBoostDto } from './dto';

@Controller('shop')
@UseGuards(JwtAuthGuard)
export class ShopController {
  constructor(private readonly shopService: ShopService) {}

  @Get('items')
  getItems(@Query('type') type?: string) {
    return this.shopService.getItems(type);
  }

  @Post('buy-item')
  buyItem(@CurrentUser('userId') userId: string, @Body() dto: BuyItemDto) {
    return this.shopService.buyItem(userId, dto.itemId);
  }

  @Post('buy-boost')
  buyBoost(
    @CurrentUser('userId') userId: string,
    @Body() dto: BuyBoostDto,
  ) {
    return this.shopService.buyBoost(userId, dto.type);
  }

  @Get('my-boosts')
  getMyBoosts(@CurrentUser('userId') userId: string) {
    return this.shopService.getUserBoosts(userId);
  }
}

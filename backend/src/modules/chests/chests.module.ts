import { Module } from '@nestjs/common';
import { RealtimeModule } from '../realtime/realtime.module';
import { ShopModule } from '../shop/shop.module';
import { ChestsController } from './chests.controller';
import { ChestsService } from './chests.service';

@Module({
  imports: [RealtimeModule, ShopModule],
  controllers: [ChestsController],
  providers: [ChestsService],
  exports: [ChestsService],
})
export class ChestsModule {}

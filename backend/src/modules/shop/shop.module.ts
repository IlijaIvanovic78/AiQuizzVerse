import { Module } from '@nestjs/common';
import { UsersModule } from '../users/users.module';
import { ShopController } from './shop.controller';
import { ShopService } from './shop.service';

@Module({
  imports: [UsersModule],
  controllers: [ShopController],
  providers: [ShopService],
})
export class ShopModule {}

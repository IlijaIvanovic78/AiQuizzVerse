import { Module } from '@nestjs/common';
import { FriendsModule } from '../friends/friends.module';
import { ReviewModule } from '../review/review.module';
import { UsersModule } from '../users/users.module';
import { ProfileController } from './profile.controller';
import { ProfileService } from './profile.service';

@Module({
  imports: [UsersModule, FriendsModule, ReviewModule],
  controllers: [ProfileController],
  providers: [ProfileService],
})
export class ProfileModule {}

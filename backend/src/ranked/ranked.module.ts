import { Module } from '@nestjs/common';
import { RankedController } from './ranked.controller';
import { RankedService } from './ranked.service';
import { AiModule } from '../ai/ai.module';

@Module({
  imports: [AiModule],
  controllers: [RankedController],
  providers: [RankedService],
  exports: [RankedService],
})
export class RankedModule {}

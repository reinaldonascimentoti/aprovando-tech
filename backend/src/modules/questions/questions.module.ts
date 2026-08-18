import { Module } from '@nestjs/common';
import { QuestionsController } from './questions.controller';
import { QuestionsService } from './questions.service';
import { SupabaseService } from '../../services/supabase.service';

import { LogStreamService } from './log-stream.service';

@Module({
  controllers: [QuestionsController],
  providers: [QuestionsService, SupabaseService, LogStreamService],
  exports: [QuestionsService, LogStreamService],
})
export class QuestionsModule {}

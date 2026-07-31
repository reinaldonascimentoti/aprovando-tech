import { Module } from '@nestjs/common';
import { QuestionsController } from './questions.controller';
import { QuestionsService } from './questions.service';
import { SupabaseService } from '../../services/supabase.service';

@Module({
  controllers: [QuestionsController],
  providers: [QuestionsService, SupabaseService],
  exports: [QuestionsService],
})
export class QuestionsModule {}

import { Module } from '@nestjs/common';
import { BullModule } from '@nestjs/bullmq';
import { PdfProcessingService } from './pdf-processing.service';
import { PdfQueueProcessor } from './pdf-processing.processor';
import { PdfProcessingController } from './pdf-processing.controller';
import { LangChainOpenAIService } from '../../services/langchain-openai.service';
import { SupabaseService } from '../../services/supabase.service';

@Module({
  imports: [
    BullModule.registerQueue({
      name: 'pdf-extraction-queue',
    }),
  ],
  controllers: [PdfProcessingController],
  providers: [PdfProcessingService, PdfQueueProcessor, LangChainOpenAIService, SupabaseService],
  exports: [PdfProcessingService],
})
export class PdfProcessingModule {}

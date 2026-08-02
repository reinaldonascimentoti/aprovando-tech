import { Module } from '@nestjs/common';
import { BullModule } from '@nestjs/bullmq';
import { EditaisController } from './editais.controller';
import { EditaisService } from './editais.service';
import { EditalParetoProcessor } from './edital-pareto.processor';
import { LangChainOpenAIService } from '../../services/langchain-openai.service';
import { SupabaseService } from '../../services/supabase.service';
import { PublicEditaisController } from './public-editais.controller';

@Module({
  imports: [
    BullModule.registerQueue({
      name: 'edital-pareto-queue',
    }),
  ],
  controllers: [EditaisController, PublicEditaisController],
  providers: [EditaisService, EditalParetoProcessor, LangChainOpenAIService, SupabaseService],
  exports: [EditaisService],
})
export class EditaisModule {}

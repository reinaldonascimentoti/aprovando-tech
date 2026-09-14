import { Module } from '@nestjs/common';
import { LegislacaoController } from './legislacao.controller';
import { LegislacaoService } from './legislacao.service';
import { LangChainOpenAIService } from '../../services/langchain-openai.service';
import { SupabaseService } from '../../services/supabase.service';

@Module({
  controllers: [LegislacaoController],
  providers: [LegislacaoService, LangChainOpenAIService, SupabaseService],
  exports: [LegislacaoService],
})
export class LegislacaoModule {}

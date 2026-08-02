import { Processor, WorkerHost } from '@nestjs/bullmq';
import { Logger } from '@nestjs/common';
import { Job } from 'bullmq';
import { LangChainOpenAIService } from '../../services/langchain-openai.service';
import { SupabaseService } from '../../services/supabase.service';

@Processor('edital-pareto-queue')
export class EditalParetoProcessor extends WorkerHost {
  private readonly logger = new Logger(EditalParetoProcessor.name);

  constructor(
    private readonly langChainService: LangChainOpenAIService,
    private readonly supabaseService: SupabaseService,
  ) {
    super();
  }

  async process(job: Job<any, any, string>): Promise<any> {
    this.logger.log(`Processing BullMQ Pareto Job ${job.id} for: ${job.data.title}`);
    const paretoAnalysis = await this.langChainService.analyzeEditalPareto(job.data.pdfText, job.data.title, job.data.cargo);
    return await this.supabaseService.addEdital(job.data.title, job.data.userId, paretoAnalysis, job.data.cargo);
  }
}

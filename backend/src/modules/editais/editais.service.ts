import { Injectable, Logger, NotFoundException } from '@nestjs/common';
import { InjectQueue } from '@nestjs/bullmq';
import { Queue } from 'bullmq';
import { LangChainOpenAIService } from '../../services/langchain-openai.service';
import { SupabaseService } from '../../services/supabase.service';
import { extractTextFromPdf } from '../../utils/pdf-helper';

@Injectable()
export class EditaisService {
  private readonly logger = new Logger(EditaisService.name);

  constructor(
    @InjectQueue('edital-pareto-queue') private paretoQueue: Queue,
    private readonly langChainService: LangChainOpenAIService,
    private readonly supabaseService: SupabaseService,
  ) {}

  async uploadAndAnalyzeEdital(file: Express.Multer.File, title: string, userId: string) {
    this.logger.log(`Processing Edital Upload & Pareto Analysis for: ${title}`);

    const pdfText = file?.buffer
      ? await extractTextFromPdf(file.buffer, title, this.logger)
      : `Edital oficial: ${title}`;

    try {
      await this.paretoQueue.add('analyze-pareto', {
        title,
        pdfText,
        userId,
      });
    } catch (e) {
      this.logger.warn(`BullMQ queue offline for Edital (${e.message}). Processing synchronously.`);
    }

    const paretoAnalysis = await this.langChainService.analyzeEditalPareto(pdfText, title);
    const saved = await this.supabaseService.addEdital(title, userId, paretoAnalysis);

    return saved;
  }

  async getAllEditais() {
    return this.supabaseService.getEditais();
  }

  async getEditalPareto(id: string) {
    const edital = await this.supabaseService.getEditalById(id);
    if (!edital) {
      throw new NotFoundException(`Edital com ID ${id} não foi encontrado.`);
    }
    return edital;
  }

  async toggleTopicStatus(editalId: string, topicId: string, userId: string) {
    const updatedEdital = await this.supabaseService.toggleTopicCompletion(editalId, topicId, userId);
    if (!updatedEdital) {
      throw new NotFoundException(`Tópico ou Edital não encontrado.`);
    }
    return updatedEdital;
  }
}

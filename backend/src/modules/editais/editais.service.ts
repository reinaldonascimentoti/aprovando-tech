import { Injectable, Logger, NotFoundException } from '@nestjs/common';
import { InjectQueue } from '@nestjs/bullmq';
import { Queue } from 'bullmq';
import { LangChainOpenAIService } from '../../services/langchain-openai.service';
import { SupabaseService } from '../../services/supabase.service';
import { extractTextFromPdf } from '../../utils/pdf-helper';
import { EditalUserContext } from './editais.types';

@Injectable()
export class EditaisService {
  private readonly logger = new Logger(EditaisService.name);

  constructor(
    @InjectQueue('edital-pareto-queue') private paretoQueue: Queue,
    private readonly langChainService: LangChainOpenAIService,
    private readonly supabaseService: SupabaseService,
  ) {}

  async uploadAndAnalyzeEdital(
    file: Express.Multer.File,
    title: string,
    userId: string,
    link?: string,
    userContext?: EditalUserContext,
  ) {
    this.logger.log(`Processing Edital Upload & Pareto Analysis for: ${title} | Cargo: ${userContext?.cargo}`);

    const pdfText = file?.buffer
      ? await extractTextFromPdf(file.buffer, title, this.logger)
      : (link ? `Conteúdo extraído do edital no link: ${link}` : `Edital oficial: ${title}`);

    try {
      await this.paretoQueue.add('analyze-pareto', {
        title,
        pdfText,
        userId,
        userContext,
      });
    } catch (e) {
      this.logger.warn(`BullMQ queue offline for Edital (${e.message}). Processing synchronously.`);
    }

    const paretoAnalysis = await this.langChainService.analyzeEditalPareto(pdfText, title, userContext);
    const saved = await this.supabaseService.addEdital(title, userId, paretoAnalysis, userContext);

    return saved;
  }

  async getAllEditais() {
    return this.supabaseService.getEditais();
  }

  async getPublicEditais() {
    const editais = await this.supabaseService.getEditais();
    // Return only public metadata fields
    return editais.map(e => ({
      id: e.id,
      title: e.title,
      uploaded_by: e.uploaded_by,
      uploader_name: e.uploader_name,
      created_at: e.created_at,
    }));
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

  async sendEditalToUser(editalId: string, userId: string) {
    this.logger.log(`Enviando edital ${editalId} para o usuário ${userId}`);
    return this.supabaseService.sendEditalToUser(editalId, userId);
  }
}

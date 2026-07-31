import { Injectable, Logger } from '@nestjs/common';
import { InjectQueue } from '@nestjs/bullmq';
import { Queue } from 'bullmq';
import { LangChainOpenAIService } from '../../services/langchain-openai.service';
import { SupabaseService } from '../../services/supabase.service';
import { extractTextFromPdf } from '../../utils/pdf-helper';

@Injectable()
export class PdfProcessingService {
  private readonly logger = new Logger(PdfProcessingService.name);

  constructor(
    @InjectQueue('pdf-extraction-queue') private pdfQueue: Queue,
    private readonly langChainService: LangChainOpenAIService,
    private readonly supabaseService: SupabaseService,
  ) {}

  async queuePdfProcessing(file: Express.Multer.File, originalName: string) {
    this.logger.log(`Queueing PDF lesson extraction for: ${originalName}`);

    // If BullMQ / Redis is available, dispatch job to queue
    try {
      await this.pdfQueue.add('extract-questions', {
        filename: originalName,
        buffer: file.buffer ? file.buffer.toString('base64') : '',
      });
      this.logger.log(`Job queued successfully in BullMQ for ${originalName}`);
    } catch (e) {
      this.logger.warn(`BullMQ queue offline (${e.message}). Executing job synchronously.`);
    }

    // Process directly / fallback sync
    return this.processPdfJob(originalName, file.buffer);
  }

  async processPdfJob(filename: string, buffer?: Buffer) {
    let extractedText = buffer
      ? await extractTextFromPdf(buffer, filename, this.logger)
      : `Conteúdo do arquivo PDF de aula: ${filename}`;

    const questions = await this.langChainService.extractQuestionsFromPdfText(extractedText, filename);
    const saved = await this.supabaseService.addExtractedQuestions(filename, questions);

    return {
      status: 'success',
      filename,
      extracted_count: saved.length,
      questions: saved,
    };
  }
}

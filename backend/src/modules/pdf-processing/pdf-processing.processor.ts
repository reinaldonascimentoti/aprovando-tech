import { Processor, WorkerHost } from '@nestjs/bullmq';
import { Logger } from '@nestjs/common';
import { Job } from 'bullmq';
import { PdfProcessingService } from './pdf-processing.service';

@Processor('pdf-extraction-queue')
export class PdfQueueProcessor extends WorkerHost {
  private readonly logger = new Logger(PdfQueueProcessor.name);

  constructor(private readonly pdfProcessingService: PdfProcessingService) {
    super();
  }

  async process(job: Job<any, any, string>): Promise<any> {
    this.logger.log(`Processing BullMQ Job ${job.id} for file: ${job.data.filename}`);
    const buffer = job.data.buffer ? Buffer.from(job.data.buffer, 'base64') : undefined;
    return await this.pdfProcessingService.processPdfJob(job.data.filename, buffer);
  }
}

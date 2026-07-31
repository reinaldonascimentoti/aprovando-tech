import { Controller, Post, UseInterceptors, UploadedFile, BadRequestException } from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { PdfProcessingService } from './pdf-processing.service';

@Controller('api/pdf')
export class PdfProcessingController {
  constructor(private readonly pdfProcessingService: PdfProcessingService) {}

  @Post('upload-lesson')
  @UseInterceptors(FileInterceptor('file'))
  async uploadLessonPdf(@UploadedFile() file: Express.Multer.File) {
    if (!file) {
      throw new BadRequestException('Nenhum arquivo PDF foi enviado.');
    }

    const result = await this.pdfProcessingService.queuePdfProcessing(file, file.originalname);
    return {
      message: 'PDF enviado e processado com sucesso via IA!',
      data: result,
    };
  }
}

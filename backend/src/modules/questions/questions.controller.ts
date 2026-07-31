import { Controller, Get, Patch, Param, Query } from '@nestjs/common';
import { QuestionsService } from './questions.service';

@Controller('api/questions')
export class QuestionsController {
  constructor(private readonly questionsService: QuestionsService) {}

  @Get()
  async getQuestions(@Query('releasedOnly') releasedOnly?: string) {
    const isReleased = releasedOnly === 'true';
    return this.questionsService.getQuestions(isReleased);
  }

  @Get('quality-analysis')
  async getQualityAnalysis() {
    return this.questionsService.getQualityAnalysis();
  }

  @Patch(':id/toggle-release')
  async toggleRelease(@Param('id') id: string) {
    const question = await this.questionsService.toggleReleaseStatus(id);
    return {
      message: `Status de liberação da questão ${id} atualizado.`,
      data: question,
    };
  }
}

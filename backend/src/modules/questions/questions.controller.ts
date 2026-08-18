import { Controller, Get, Post, Put, Patch, Delete, Param, Query, Body, Sse } from '@nestjs/common';
import { QuestionsService } from './questions.service';
import { LogStreamService } from './log-stream.service';
import { Observable } from 'rxjs';

@Controller('api/questions')
export class QuestionsController {
  constructor(
    private readonly questionsService: QuestionsService,
    private readonly logStreamService: LogStreamService
  ) {}

  @Sse('import-logs')
  importLogs(): Observable<any> {
    return this.logStreamService.getStream();
  }

  @Get()
  async getQuestions(@Query('releasedOnly') releasedOnly?: string) {
    const isReleased = releasedOnly === 'true';
    return this.questionsService.getQuestions(isReleased);
  }

  @Get('stats')
  async getPublicStats() {
    return this.questionsService.getPublicStats();
  }

  @Get('quality-analysis')
  async getQualityAnalysis() {
    return this.questionsService.getQualityAnalysis();
  }

  @Post('import')
  async importQuestions(@Body() body: any) {
    try {
      let questionsArray: any[] = [];
      if (Array.isArray(body)) {
        questionsArray = body.map((q) => ({
          disciplina: q.disciplina || q.subject || q.materia || null,
          ...q,
        }));
      } else if (body && typeof body === 'object') {
        const topDisciplina = body.disciplina || body.subject || body.materia || null;
        const rawArray = body.questoes || body.questions || body.data || body.items;
        if (Array.isArray(rawArray)) {
          questionsArray = rawArray.map((q) => ({
            disciplina: q.disciplina || topDisciplina || q.subject || null,
            ...q,
          }));
        } else if (body.enunciado || body.pergunta || body.texto || body.statement) {
          questionsArray = [{
            disciplina: body.disciplina || topDisciplina || null,
            ...body,
          }];
        }
      }

      const result = await this.questionsService.importQuestions(questionsArray);
      return {
        message: `${result.length} questões processadas com sucesso.`,
        data: result,
      };
    } catch (err: any) {
      console.error('Erro na importação de questões:', err);
      return {
        message: `Erro ao importar questões: ${err?.message || 'Falha no processamento.'}`,
        data: [],
      };
    }
  }

  @Patch(':id/toggle-release')
  async toggleRelease(@Param('id') id: string) {
    const question = await this.questionsService.toggleReleaseStatus(id);
    return {
      message: `Status de liberação da questão ${id} atualizado.`,
      data: question,
    };
  }

  @Put(':id')
  async updateQuestion(@Param('id') id: string, @Body() body: any) {
    const question = await this.questionsService.updateQuestion(id, body);
    return {
      message: `Questão ${id} atualizada com sucesso.`,
      data: question,
    };
  }

  @Delete(':id')
  async deleteQuestion(@Param('id') id: string) {
    const result = await this.questionsService.deleteQuestion(id);
    return {
      message: `Questão ${id} excluída com sucesso.`,
      data: result,
    };
  }
}

import { Controller, Get, Post, Patch, Delete, Param, Body, Query, UseInterceptors, UploadedFile, BadRequestException } from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { EditaisService } from './editais.service';
import { EditalUserContext } from './editais.types';

@Controller('api/editais')
export class EditaisController {
  constructor(private readonly editaisService: EditaisService) {}

  @Get()
  async listEditais(@Query('userId') userId?: string) {
    return this.editaisService.getAllEditais(userId);
  }

  @Get(':id')
  async getEditalDetails(@Param('id') id: string) {
    const edital = await this.editaisService.getEditalPareto(id);
    return { message: 'Edital encontrado', data: edital };
  }

  @Post('upload')
  @UseInterceptors(FileInterceptor('file'))
  async uploadEdital(
    @UploadedFile() file: Express.Multer.File,
    @Body('title') title: string,
    @Body('link') link: string,
    @Body('userId') userId: string,
    @Body('cargo') cargo: string,
    @Body('concurso') concurso: string,
    @Body('dataProva') dataProva: string,
    @Body('horasPorDia') horasPorDia: string,
    @Body('diasPorSemana') diasPorSemana: string,
  ) {
    if (!cargo || !cargo.trim()) {
      throw new BadRequestException('O campo "cargo" é obrigatório para direcionar a busca do conteúdo programático no edital.');
    }

    if (!file && (!link || !link.trim())) {
      throw new BadRequestException('Por favor, selecione um arquivo PDF ou informe um link do edital.');
    }

    const editalTitle = title || (file ? file.originalname.replace('.pdf', '') : (link ? link : 'Novo Edital'));
    const uId = userId || 'usr-2';

    const userContext: EditalUserContext = {
      cargo: cargo.trim(),
      concurso: concurso?.trim() || null,
      dataProva: dataProva || null,
      horasPorDia: horasPorDia ? parseFloat(horasPorDia) : null,
      diasPorSemana: diasPorSemana ? parseInt(diasPorSemana, 10) : null,
    };

    const edital = await this.editaisService.uploadAndAnalyzeEdital(file, editalTitle, uId, link, userContext);
    return {
      message: 'Edital enviado e analisado com a Regra Pareto 80/20!',
      data: edital,
    };
  }

  @Patch(':id/context')
  async updateEditalContext(
    @Param('id') id: string,
    @Body('cargo') cargo: string,
    @Body('concurso') concurso: string,
    @Body('dataProva') dataProva: string,
    @Body('horasPorDia') horasPorDia: string,
    @Body('diasPorSemana') diasPorSemana: string,
  ) {
    if (!cargo || !cargo.trim()) {
      throw new BadRequestException('O campo "cargo" é obrigatório.');
    }
    const userContext = {
      cargo: cargo.trim(),
      concurso: concurso?.trim() || null,
      dataProva: dataProva || null,
      horasPorDia: horasPorDia ? parseFloat(horasPorDia) : null,
      diasPorSemana: diasPorSemana ? parseInt(diasPorSemana, 10) : null,
    };
    const updated = await this.editaisService.updateEditalContext(id, userContext);
    return { message: 'Contexto do edital atualizado!', data: updated };
  }

  @Post(':id/reanalyze')
  @UseInterceptors(FileInterceptor('file'))
  async reanalyzeEdital(
    @Param('id') id: string,
    @UploadedFile() file: Express.Multer.File,
    @Body('link') link: string,
    @Body('cargo') cargo: string,
    @Body('concurso') concurso: string,
    @Body('dataProva') dataProva: string,
    @Body('horasPorDia') horasPorDia: string,
    @Body('diasPorSemana') diasPorSemana: string,
  ) {
    if (!cargo || !cargo.trim()) {
      throw new BadRequestException('O campo "cargo" é obrigatório para a análise Pareto.');
    }
    const userContext = {
      cargo: cargo.trim(),
      concurso: concurso?.trim() || null,
      dataProva: dataProva || null,
      horasPorDia: horasPorDia ? parseFloat(horasPorDia) : null,
      diasPorSemana: diasPorSemana ? parseInt(diasPorSemana, 10) : null,
    };
    const result = await this.editaisService.reanalyzeEdital(id, file, link, userContext);
    return { message: 'Edital re-analisado com sucesso!', data: result };
  }

  @Post(':id/analisar-pareto')
  async analyzePareto(
    @Param('id') id: string,
    @Body('cargo') cargo?: string,
    @Body('concurso') concurso?: string,
    @Body('dataProva') dataProva?: string,
    @Body('horasPorDia') horasPorDia?: string,
    @Body('diasPorSemana') diasPorSemana?: string,
  ) {
    const userContext = cargo ? {
      cargo: cargo.trim(),
      concurso: concurso?.trim() || null,
      dataProva: dataProva || null,
      horasPorDia: horasPorDia ? parseFloat(horasPorDia) : null,
      diasPorSemana: diasPorSemana ? parseInt(diasPorSemana, 10) : null,
    } : undefined;

    const result = await this.editaisService.analyzeParetoForEdital(id, userContext);
    return {
      message: 'Análise Pareto 80/20 executada com sucesso!',
      data: result,
    };
  }

  @Delete(':id')
  async deleteEdital(@Param('id') id: string) {
    const result = await this.editaisService.deleteEdital(id);
    return {
      message: 'Edital excluído com sucesso!',
      data: result,
    };
  }

  @Delete(':id/dismiss')
  async dismissEdital(
    @Param('id') editalId: string,
    @Body('userId') userId: string,
  ) {
    if (!userId) {
      throw new BadRequestException('ID do usuário é obrigatório.');
    }
    const result = await this.editaisService.dismissEdital(editalId, userId);
    return { message: 'Edital removido da sua lista.', data: result };
  }

  @Post(':id/toggle-topic')
  async toggleTopic(
    @Param('id') editalId: string,
    @Body('topicId') topicId: string,
    @Body('userId') userId: string,
  ) {
    if (!topicId) {
      throw new BadRequestException('ID do tópico é obrigatório.');
    }
    const uId = userId || 'usr-2';
    const updated = await this.editaisService.toggleTopicStatus(editalId, topicId, uId);
    return {
      message: 'Status do tópico atualizado!',
      data: updated,
    };
  }

  @Post(':id/send-to-user')
  async sendEditalToUser(
    @Param('id') editalId: string,
    @Body('userId') userId: string,
  ) {
    if (!userId) {
      throw new BadRequestException('ID do usuário é obrigatório.');
    }
    const result = await this.editaisService.sendEditalToUser(editalId, userId);
    if (!result) {
      throw new BadRequestException('Não foi possível enviar o edital para o usuário.');
    }
    return {
      message: result.already_assigned
        ? 'Este edital já foi enviado para este usuário.'
        : 'Edital enviado com sucesso para o usuário!',
      data: result,
    };
  }
}

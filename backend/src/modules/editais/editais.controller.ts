import { Controller, Get, Post, Param, Body, UseInterceptors, UploadedFile, BadRequestException } from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { EditaisService } from './editais.service';
import { EditalUserContext } from './editais.types';

@Controller('api/editais')
export class EditaisController {
  constructor(private readonly editaisService: EditaisService) {}

  @Get()
  async listEditais() {
    return this.editaisService.getAllEditais();
  }

  @Get(':id')
  async getEditalDetails(@Param('id') id: string) {
    return this.editaisService.getEditalPareto(id);
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
      throw new BadRequestException('O campo "cargo" é obrigatório para a análise Pareto.');
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

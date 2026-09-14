import {
  Controller, Get, Post, Delete, Param, Body, Query,
  UseInterceptors, UploadedFile, BadRequestException, Logger,
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { LegislacaoService } from './legislacao.service';

@Controller('api/legislacao')
export class LegislacaoController {
  private readonly logger = new Logger(LegislacaoController.name);

  constructor(private readonly legislacaoService: LegislacaoService) {}

  // Lista legislações do usuário
  @Get()
  async listar(@Query('userId') userId: string) {
    if (!userId) throw new BadRequestException('userId é obrigatório.');
    return this.legislacaoService.listarPorUsuario(userId);
  }

  // Detalhes de uma legislação (inclui artigos, processamentos e artigos lidos)
  @Get(':id')
  async detalhar(
    @Param('id') id: string,
    @Query('userId') userId?: string,
  ) {
    return this.legislacaoService.detalhar(id, userId);
  }

  // Lista artigos lidos pelo usuário
  @Get(':id/artigos-lidos')
  async getArtigosLidos(
    @Param('id') legislacaoId: string,
    @Query('userId') userId: string,
  ) {
    if (!userId) throw new BadRequestException('userId é obrigatório.');
    const artigosLidos = await this.legislacaoService.getArtigosLidos(legislacaoId, userId);
    return { data: artigosLidos };
  }

  // Marcar / desmarcar artigo como lido pelo usuário
  @Post(':id/artigos/:artigoId/toggle-lido')
  async toggleArtigoLido(
    @Param('id') legislacaoId: string,
    @Param('artigoId') artigoId: string,
    @Body('userId') userId: string,
    @Body('artigo_numero') artigoNumero: string,
    @Body('lido') lido?: boolean,
  ) {
    if (!userId) throw new BadRequestException('userId é obrigatório.');
    if (!artigoNumero) throw new BadRequestException('artigo_numero é obrigatório.');
    return this.legislacaoService.toggleArtigoLido(
      legislacaoId,
      artigoId,
      String(artigoNumero),
      userId,
      lido,
    );
  }

  // Comentário de um artigo específico
  @Get(':id/artigos/:artigoId/comentario')
  async getComentario(@Param('artigoId') artigoId: string) {
    const comentario = await this.legislacaoService.getComentarioArtigo(artigoId);
    return { data: comentario };
  }


  // ---------------------------------------------------------------
  // Agente 3 — Plano de Cronograma de Estudos
  // ---------------------------------------------------------------

  /**
   * Busca o plano de cronograma existente para uma legislação.
   * GET /api/legislacao/:id/plano?userId=xxx
   */
  @Get(':id/plano')
  async getPlano(
    @Param('id') legislacaoId: string,
    @Query('userId') userId: string,
  ) {
    if (!userId) throw new BadRequestException('userId é obrigatório.');
    const plano = await this.legislacaoService.getPlano(legislacaoId, userId);
    return { data: plano };
  }

  /**
   * Gera (ou regenera) o plano de cronograma de estudos para uma legislação.
   * POST /api/legislacao/:id/plano
   * Body: { userId, data_prova?, tempo_diario_minutos?, dias_disponiveis?, nivel_estudante?, objetivo?, prioridade_legislacao? }
   */
  @Post(':id/plano')
  async gerarPlano(
    @Param('id') legislacaoId: string,
    @Body('userId') userId: string,
    @Body('data_inicio') dataInicio?: string,
    @Body('data_prova') dataProva?: string,
    @Body('tempo_diario_minutos') tempoDiarioMinutos?: string,
    @Body('dias_disponiveis') diasDisponiveis?: number[],
    @Body('nivel_estudante') nivelEstudante?: string,
    @Body('objetivo') objetivo?: string,
    @Body('prioridade_legislacao') prioridadeLegislacao?: string,
  ) {
    if (!userId) throw new BadRequestException('userId é obrigatório.');

    const preferencias = {
      data_inicio: dataInicio || undefined,
      data_prova: dataProva || undefined,
      tempo_diario_minutos: tempoDiarioMinutos ? parseInt(tempoDiarioMinutos, 10) : undefined,
      dias_disponiveis: Array.isArray(diasDisponiveis) ? diasDisponiveis.map(Number) : undefined,
      nivel_estudante: nivelEstudante || undefined,
      objetivo: objetivo || undefined,
      prioridade_legislacao: prioridadeLegislacao || undefined,
    };

    // Inicia a geração em background (pode levar 15-60s)
    const plano = await this.legislacaoService.gerarPlano(legislacaoId, userId, preferencias);
    return {
      message: 'Plano de cronograma gerado com sucesso.',
      data: plano,
    };
  }

  // ---------------------------------------------------------------
  // Upload de nova legislação + início do processamento
  // ---------------------------------------------------------------

  @Post('upload')
  @UseInterceptors(FileInterceptor('file'))
  async upload(
    @UploadedFile() file: Express.Multer.File,
    @Body('userId') userId: string,
    @Body('titulo') titulo: string,
    @Body('tipo') tipo?: string,
    @Body('numero') numero?: string,
    @Body('ano') ano?: string,
  ) {
    if (!userId) throw new BadRequestException('userId é obrigatório.');
    if (!titulo || !titulo.trim()) throw new BadRequestException('Título é obrigatório.');
    if (!file) throw new BadRequestException('Arquivo é obrigatório.');

    const legislacao = await this.legislacaoService.uploadEProcessar(
      file,
      userId,
      titulo.trim(),
      tipo?.trim() || undefined,
      numero?.trim() || undefined,
      ano ? parseInt(ano, 10) : undefined,
    );

    return {
      message: 'Legislação recebida. Processamento iniciado em background.',
      data: legislacao,
    };
  }

  // Reprocessar artigo específico (retry)
  @Post(':id/artigos/:artigoId/reprocessar')
  async reprocessarArtigo(
    @Param('id') legislacaoId: string,
    @Param('artigoId') artigoId: string,
  ) {
    const result = await this.legislacaoService.reprocessarArtigo(legislacaoId, artigoId);
    return result;
  }

  // Excluir legislação
  @Delete(':id')
  async excluir(@Param('id') id: string) {
    return this.legislacaoService.excluir(id);
  }
}

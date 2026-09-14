import { Injectable, Logger, NotFoundException } from '@nestjs/common';
import { LangChainOpenAIService } from '../../services/langchain-openai.service';
import { SupabaseService } from '../../services/supabase.service';
import { extractTextFromPdf } from '../../utils/pdf-helper';

@Injectable()
export class LegislacaoService {
  private readonly logger = new Logger(LegislacaoService.name);

  constructor(
    private readonly langChainService: LangChainOpenAIService,
    private readonly supabaseService: SupabaseService,
  ) {}

  // ---------------------------------------------------------------
  // Upload + início do processamento completo
  // ---------------------------------------------------------------
  async uploadEProcessar(
    file: Express.Multer.File,
    userId: string,
    titulo: string,
    tipo?: string,
    numero?: string,
    ano?: number,
  ) {
    this.logger.log(`[Legislação] Iniciando upload para userId=${userId}, titulo="${titulo}"`);

    // 1. Cria o registro da legislação
    const legislacao = await this.supabaseService.createLegislacao({ user_id: userId, titulo, tipo, numero, ano });
    if (!legislacao) throw new Error('Falha ao criar registro da legislação.');

    const legislacaoId = legislacao.id;

    // 2. Salva o arquivo no Storage
    if (file?.buffer) {
      const storagePath = await this.supabaseService.uploadLegislacaoFile(userId, legislacaoId, file.buffer, file.originalname);
      if (storagePath) {
        await this.supabaseService.updateLegislacao(legislacaoId, {
          arquivo_path: storagePath,
          arquivo_nome: file.originalname,
        });
      }
    }

    // 3. Inicia o processamento em background (não aguarda)
    this.processarLegislacao(legislacaoId, file, titulo, tipo).catch(err => {
      this.logger.error(`[Legislação] Erro em background para ${legislacaoId}: ${err.message}`);
    });

    return legislacao;
  }

  // ---------------------------------------------------------------
  // Pipeline completo: Extrator → Artigos → Comentador
  // ---------------------------------------------------------------
  async processarLegislacao(
    legislacaoId: string,
    file: Express.Multer.File | undefined,
    titulo: string,
    tipo?: string,
  ) {
    try {
      // === ETAPA 1: EXTRAÇÃO ===
      await this.supabaseService.updateLegislacao(legislacaoId, { status: 'extraindo' });
      await this.supabaseService.upsertProcessamento(legislacaoId, 'extracao', { status: 'processando' });

      this.logger.log(`[Extrator] Iniciando extração para legislacaoId=${legislacaoId}`);

      // Extrai texto do PDF como fallback
      let pdfText = '';
      if (file?.buffer) {
        try {
          pdfText = await extractTextFromPdf(file.buffer, titulo, this.logger);
        } catch (e) {
          this.logger.warn(`[Extrator] Falha ao extrair texto do PDF: ${e.message}`);
        }
      }

      // Chama o Agente 1 (Gemini File API com fallback texto)
      const extraido = await this.langChainService.extractLegislacao(
        file?.buffer ?? null,
        pdfText,
        file?.originalname ?? titulo,
      );

      // Valida resultado
      if (!extraido || !Array.isArray(extraido.artigos) || extraido.artigos.length === 0) {
        throw new Error('Extrator não retornou artigos válidos.');
      }

      // Atualiza metadados da legislação com o que o Agente 1 extraiu
      const metaLegis = extraido.legislacao || {};
      await this.supabaseService.updateLegislacao(legislacaoId, {
        tipo: metaLegis.tipo || tipo || null,
        numero: metaLegis.numero || null,
        ano: metaLegis.ano || null,
        ementa: metaLegis.ementa || null,
        data_publicacao: metaLegis.data_publicacao || null,
        data_vigencia: metaLegis.data_vigencia || null,
        orgao_emissor: metaLegis.orgao_emissor || null,
        fonte: metaLegis.fonte || null,
      });

      // Salva os artigos no banco
      const artigos = extraido.artigos;
      const artigosSalvos = await this.supabaseService.createArtigosLote(
        legislacaoId,
        artigos.map(a => ({
          ordem: a.ordem,
          numero: a.numero,
          titulo: a.titulo || null,
          texto_original: a.texto_original,
          status_dispositivo: a.status_dispositivo || 'vigente_no_documento',
          estrutura: a.dispositivos || [],
        })),
      );

      this.logger.log(`[Extrator] ✅ ${artigosSalvos.length} artigos salvos para legislacaoId=${legislacaoId}`);

      await this.supabaseService.updateLegislacao(legislacaoId, { status: 'extraida' });
      await this.supabaseService.upsertProcessamento(legislacaoId, 'extracao', {
        status: 'concluido',
        quantidade_total: artigosSalvos.length,
        quantidade_processada: artigosSalvos.length,
      });

      // === ETAPA 2: COMENTÁRIOS (artigo por artigo) ===
      await this.supabaseService.updateLegislacao(legislacaoId, { status: 'comentando' });
      await this.supabaseService.upsertProcessamento(legislacaoId, 'comentarios', {
        status: 'processando',
        quantidade_total: artigosSalvos.length,
        quantidade_processada: 0,
      });

      let processados = 0;
      for (const artigoSalvo of artigosSalvos) {
        await this.comentarArtigoIndividual(legislacaoId, artigoSalvo, titulo, tipo || '');
        processados++;
        // Atualiza progresso a cada artigo
        await this.supabaseService.upsertProcessamento(legislacaoId, 'comentarios', {
          status: 'processando',
          quantidade_total: artigosSalvos.length,
          quantidade_processada: processados,
        });
      }

      // === ETAPA 3: FINALIZAÇÃO ===
      await this.supabaseService.updateLegislacao(legislacaoId, { status: 'concluida' });
      await this.supabaseService.upsertProcessamento(legislacaoId, 'comentarios', {
        status: 'concluido',
        quantidade_total: artigosSalvos.length,
        quantidade_processada: processados,
      });
      await this.supabaseService.upsertProcessamento(legislacaoId, 'finalizacao', { status: 'concluido' });

      this.logger.log(`[Legislação] ✅ Processamento completo para legislacaoId=${legislacaoId}`);
    } catch (err: any) {
      this.logger.error(`[Legislação] ❌ Erro ao processar ${legislacaoId}: ${err.message}`);
      await this.supabaseService.updateLegislacao(legislacaoId, { status: 'erro' });
      await this.supabaseService.upsertProcessamento(legislacaoId, 'extracao', {
        status: 'erro',
        erro: err.message,
      });
    }
  }

  // ---------------------------------------------------------------
  // Comenta um artigo individual (usado pelo pipeline e pelo retry)
  // ---------------------------------------------------------------
  async comentarArtigoIndividual(
    legislacaoId: string,
    artigo: any,
    legislacaoTitulo: string,
    legislacaoTipo: string,
  ) {
    const artigoId = artigo.id;
    const estrutura = artigo.estrutura?.dispositivos || [];

    try {
      this.logger.log(`[Comentador] Comentando Art. ${artigo.numero} (id=${artigoId})`);

      // Marca como processando
      await this.supabaseService.upsertComentario(legislacaoId, artigoId, {}, 'erro', undefined);

      const comentario = await this.langChainService.comentarArtigo(
        {
          numero: artigo.numero,
          texto_original: artigo.texto_original,
          dispositivos: estrutura,
        },
        legislacaoTitulo,
        legislacaoTipo,
      );

      // Valida campos mínimos
      if (!comentario || typeof comentario.resumo === 'undefined') {
        throw new Error('Comentador retornou estrutura inválida.');
      }

      await this.supabaseService.upsertComentario(legislacaoId, artigoId, comentario, 'concluido');
      this.logger.log(`[Comentador] ✅ Art. ${artigo.numero} concluído.`);
    } catch (err: any) {
      this.logger.error(`[Comentador] ❌ Art. ${artigo.numero}: ${err.message}`);
      await this.supabaseService.upsertComentario(legislacaoId, artigoId, {}, 'erro', err.message);
    }
  }

  // ---------------------------------------------------------------
  // Reprocessar artigo específico (retry)
  // ---------------------------------------------------------------
  async reprocessarArtigo(legislacaoId: string, artigoId: string) {
    const legislacao = await this.supabaseService.getLegislacaoById(legislacaoId);
    if (!legislacao) throw new NotFoundException('Legislação não encontrada.');

    const artigo = await this.supabaseService.getArtigoById(artigoId);
    if (!artigo) throw new NotFoundException('Artigo não encontrado.');

    this.logger.log(`[Retry] Reprocessando Art. ${artigo.numero} da legislação ${legislacaoId}`);
    await this.comentarArtigoIndividual(legislacaoId, artigo, legislacao.titulo, legislacao.tipo || '');

    return { message: `Art. ${artigo.numero} reprocessado.` };
  }

  // ---------------------------------------------------------------
  // Listagem e detalhes
  // ---------------------------------------------------------------
  async listarPorUsuario(userId: string) {
    const legislacoes = await this.supabaseService.listLegislacoesByUser(userId);

    // Para cada legislação, busca contadores de artigos/comentários
    const result = await Promise.all(
      legislacoes.map(async leg => {
        const processamentos = await this.supabaseService.getProcessamentosByLegislacao(leg.id);
        return { ...leg, processamentos };
      }),
    );
    return result;
  }

  async detalhar(legislacaoId: string, userId?: string) {
    const legislacao = await this.supabaseService.getLegislacaoById(legislacaoId);
    if (!legislacao) throw new NotFoundException('Legislação não encontrada.');

    const [artigos, processamentos, artigosLidos] = await Promise.all([
      this.supabaseService.listArtigosByLegislacao(legislacaoId),
      this.supabaseService.getProcessamentosByLegislacao(legislacaoId),
      userId ? this.supabaseService.getArtigosLidos(legislacaoId, userId) : Promise.resolve([]),
    ]);

    return { ...legislacao, artigos, processamentos, artigos_lidos: artigosLidos };
  }


  async getComentarioArtigo(artigoId: string) {
    return this.supabaseService.getComentarioByArtigo(artigoId);
  }

  async excluir(legislacaoId: string) {
    const ok = await this.supabaseService.deleteLegislacao(legislacaoId);
    if (!ok) throw new Error('Falha ao excluir legislação.');
    return { message: 'Legislação excluída com sucesso.' };
  }

  // ---------------------------------------------------------------
  // Agente 3 — Geração e consulta do Plano de Cronograma de Estudos
  // ---------------------------------------------------------------

  /**
   * Gera (ou regenera) o plano de cronograma para uma legislação.
   * Chama o Agente 3 (LLM) com o contexto completo dos Agentes 1 e 2.
   */
  async gerarPlano(
    legislacaoId: string,
    userId: string,
    preferencias?: {
      data_inicio?: string;
      data_prova?: string;
      tempo_diario_minutos?: number;
      dias_disponiveis?: number[];
      nivel_estudante?: string;
      objetivo?: string;
      prioridade_legislacao?: string;
    },
  ) {
    // 1. Valida que a legislação existe
    const legislacao = await this.supabaseService.getLegislacaoById(legislacaoId);
    if (!legislacao) throw new NotFoundException('Legislação não encontrada.');

    this.logger.log(`[Planejador] Iniciando geração de plano para legislacaoId=${legislacaoId}, userId=${userId}`);

    // 2. Cria/atualiza o registro do plano com status=processando
    await this.supabaseService.upsertPlanoLegislacao(legislacaoId, userId, {
      status: 'processando',
      preferencias: preferencias || {},
      erro: null,
    });

    try {
      // 3. Busca artigos com comentários completos
      const artigosComComentarios = await this.supabaseService.listArtigosComComentarios(legislacaoId);

      if (!artigosComComentarios || artigosComComentarios.length === 0) {
        throw new Error('Nenhum artigo encontrado para esta legislação. O processamento pode não ter sido concluído.');
      }

      // 4. Chama o Agente 3 (LLM)
      const planoJson = await this.langChainService.gerarPlanoCronograma(
        {
          id: legislacao.id,
          titulo: legislacao.titulo,
          tipo: legislacao.tipo,
          numero: legislacao.numero,
          ano: legislacao.ano,
          ementa: legislacao.ementa,
        },
        artigosComComentarios,
        preferencias || {},
      );

      // 5. Salva o plano gerado com status=concluido
      const planoSalvo = await this.supabaseService.upsertPlanoLegislacao(legislacaoId, userId, {
        status: 'concluido',
        plano_estudo: planoJson.plano_estudo || {},
        priorizacao: planoJson.priorizacao || [],
        blocos: planoJson.blocos || [],
        sessoes: planoJson.sessoes || [],
        revisoes: planoJson.revisoes || [],
        resumo: planoJson.resumo || {},
        alertas: planoJson.alertas || [],
        preferencias: preferencias || {},
        erro: null,
      });

      this.logger.log(`[Planejador] ✅ Plano gerado: ${planoJson.blocos?.length ?? 0} blocos, ${planoJson.sessoes?.length ?? 0} sessões.`);
      return planoSalvo;
    } catch (err: any) {
      this.logger.error(`[Planejador] ❌ Erro ao gerar plano para ${legislacaoId}: ${err.message}`);
      await this.supabaseService.upsertPlanoLegislacao(legislacaoId, userId, {
        status: 'erro',
        erro: err.message,
      });
      throw err;
    }
  }

  /**
   * Retorna os artigos lidos de uma legislação para um usuário.
   */
  async getArtigosLidos(legislacaoId: string, userId: string) {
    return this.supabaseService.getArtigosLidos(legislacaoId, userId);
  }

  /**
   * Marca ou desmarca um artigo como lido pelo usuário.
   */
  async toggleArtigoLido(
    legislacaoId: string,
    artigoId: string,
    artigoNumero: string,
    userId: string,
    lido?: boolean,
  ) {
    return this.supabaseService.toggleArtigoLido(legislacaoId, artigoId, artigoNumero, userId, lido);
  }

  /**
   * Retorna o plano de cronograma de uma legislação para um usuário,
   * incluindo os artigos lidos atualizados.
   */
  async getPlano(legislacaoId: string, userId: string) {
    const plano = await this.supabaseService.getPlanoByLegislacao(legislacaoId, userId);
    if (!plano) return null;

    const artigosLidos = await this.supabaseService.getArtigosLidos(legislacaoId, userId);
    return { ...plano, artigos_lidos: artigosLidos };
  }
}


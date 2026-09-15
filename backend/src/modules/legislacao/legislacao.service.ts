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
  // Upload + início do processamento completo (Arquivo ou Link)
  // ---------------------------------------------------------------
  async uploadEProcessar(
    file: Express.Multer.File | undefined,
    userId: string,
    titulo: string,
    tipo?: string,
    numero?: string,
    ano?: number,
    urlLink?: string,
  ) {
    this.logger.log(`[Legislação] Iniciando cadastro para userId=${userId}, titulo="${titulo}", url=${urlLink || 'nenhuma'}`);

    // 1. Cria o registro da legislação
    const legislacao = await this.supabaseService.createLegislacao({
      user_id: userId,
      titulo,
      tipo,
      numero,
      ano,
      fonte: urlLink || null,
    });
    if (!legislacao) throw new Error('Falha ao criar registro da legislação.');

    const legislacaoId = legislacao.id;

    // 2. Salva o arquivo no Storage se fornecido
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
    this.processarLegislacao(legislacaoId, file, titulo, tipo, urlLink).catch(err => {
      this.logger.error(`[Legislação] Erro em background para ${legislacaoId}: ${err.message}`);
    });

    return legislacao;
  }

  async reprocessarLegislacao(legislacaoId: string, userId: string) {
    this.logger.log(`[Legislação] Reprocessando legislacaoId=${legislacaoId} para userId=${userId}`);
    const legislacao = await this.supabaseService.getLegislacaoDetails(legislacaoId, userId);
    if (!legislacao) {
      throw new NotFoundException('Legislação não encontrada');
    }

    let fileMock: Express.Multer.File | undefined = undefined;
    if (legislacao.arquivo_path) {
      const buffer = await this.supabaseService.downloadLegislacaoFile(legislacao.arquivo_path);
      if (buffer) {
        fileMock = {
          buffer,
          originalname: legislacao.arquivo_nome || 'documento.pdf',
        } as Express.Multer.File;
      }
    }

    // Inicia o processamento em background
    this.processarLegislacao(legislacaoId, fileMock, legislacao.titulo, legislacao.tipo || undefined, legislacao.fonte || undefined).catch(err => {
      this.logger.error(`[Legislação] Erro no reprocessamento em background para ${legislacaoId}: ${err.message}`);
    });

    return { message: 'Reprocessamento iniciado' };
  }

  // ---------------------------------------------------------------
  // Pipeline completo: Extrator → Artigos → Comentador
  // ---------------------------------------------------------------
  async processarLegislacao(
    legislacaoId: string,
    file: Express.Multer.File | undefined,
    titulo: string,
    tipo?: string,
    urlLink?: string,
  ) {
    try {
      // === ETAPA 1: EXTRAÇÃO ===
      await this.supabaseService.updateLegislacao(legislacaoId, { status: 'extraindo' });
      await this.supabaseService.upsertProcessamento(legislacaoId, 'extracao', { status: 'processando' });

      this.logger.log(`[Extrator] Iniciando extração para legislacaoId=${legislacaoId}`);

      let pdfBuffer: Buffer | null = file?.buffer ?? null;
      let pdfText = '';
      let fileName = file?.originalname ?? titulo;

      // Se temos arquivo local
      if (file?.buffer) {
        try {
          pdfText = await extractTextFromPdf(file.buffer, titulo, this.logger);
        } catch (e: any) {
          this.logger.warn(`[Extrator] Falha ao extrair texto do PDF: ${e.message}`);
        }
      } else if (urlLink) {
        // Se temos link / URL
        this.logger.log(`[Extrator] Baixando conteúdo da URL: ${urlLink}`);
        try {
          const response = await fetch(urlLink, {
            headers: {
              'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
              'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,application/pdf,*/*;q=0.8',
            },
          });

          const contentType = response.headers.get('content-type') || '';

          if (contentType.includes('application/pdf')) {
            const arrayBuf = await response.arrayBuffer();
            pdfBuffer = Buffer.from(arrayBuf);
            fileName = `${titulo.replace(/[^a-zA-Z0-9]/g, '_')}.pdf`;
            pdfText = await extractTextFromPdf(pdfBuffer, titulo, this.logger);
          } else {
            // HTML ou texto web
            const html = await response.text();
            pdfText = html
              .replace(/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi, '')
              .replace(/<style\b[^<]*(?:(?!<\/style>)<[^<]*)*<\/style>/gi, '')
              .replace(/<br\s*[\/]?>/gi, '\n')
              .replace(/<\/p>/gi, '\n\n')
              .replace(/<\/div>/gi, '\n')
              .replace(/<[^>]+>/g, '')
              .replace(/&nbsp;/g, ' ')
              .replace(/&amp;/g, '&')
              .replace(/&quot;/g, '"')
              .replace(/&lt;/g, '<')
              .replace(/&gt;/g, '>')
              .replace(/\n\s*\n\s*\n/g, '\n\n')
              .trim();
          }
        } catch (e: any) {
          this.logger.error(`[Extrator] Erro ao carregar link ${urlLink}: ${e.message}`);
          throw new Error(`Falha ao acessar o link informado: ${e.message}`);
        }
      }

      // Chama o Agente 1 (Gemini File API com fallback texto)
      const extraido = await this.langChainService.extractLegislacao(
        pdfBuffer,
        pdfText,
        fileName,
      );

      // Valida resultado
      if (!extraido || !Array.isArray(extraido.artigos) || extraido.artigos.length === 0) {
        throw new Error('Extrator não retornou artigos válidos.');
      }

      // Atualiza metadados da legislação com o que o Agente 1 extraiu (sanitizando datas para formato ISO)
      const metaLegis = extraido.legislacao || {};
      await this.supabaseService.updateLegislacao(legislacaoId, {
        tipo: metaLegis.tipo || tipo || null,
        numero: metaLegis.numero || null,
        ano: metaLegis.ano ? (typeof metaLegis.ano === 'number' ? metaLegis.ano : parseInt(String(metaLegis.ano), 10) || null) : null,
        ementa: metaLegis.ementa || null,
        data_publicacao: this.formatDateIso(metaLegis.data_publicacao),
        data_vigencia: this.formatDateIso(metaLegis.data_vigencia),
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

      // === ETAPA 2: COMENTÁRIOS (com concorrência controlada) ===
      await this.processarComentariosEmFila(legislacaoId, artigosSalvos, titulo, tipo || '');

      // === ETAPA 3: FINALIZAÇÃO ===
      await this.supabaseService.updateLegislacao(legislacaoId, { status: 'concluida' });
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
  // Processamento concorrente de comentários com controle de fila
  // ---------------------------------------------------------------
  private async processarComentariosEmFila(
    legislacaoId: string,
    artigos: any[],
    titulo: string,
    tipo: string,
    concorrencia = 1,
  ) {
    await this.supabaseService.updateLegislacao(legislacaoId, { status: 'comentando' });
    const total = artigos.length;

    // Busca comentários já concluídos para não reprocessar
    const artigosComComentarios = await this.supabaseService.listArtigosByLegislacao(legislacaoId);
    const concluidosMap = new Set<string>();
    for (const art of artigosComComentarios) {
      const comentarios = Array.isArray(art.legislacao_comentarios)
        ? art.legislacao_comentarios
        : art.legislacao_comentarios ? [art.legislacao_comentarios] : [];
      if (comentarios.some((c: any) => c.status === 'concluido')) {
        concluidosMap.add(art.id);
      }
    }

    let processados = concluidosMap.size;
    await this.supabaseService.upsertProcessamento(legislacaoId, 'comentarios', {
      status: 'processando',
      quantidade_total: total,
      quantidade_processada: processados,
    });

    const pendentes = artigos.filter(a => !concluidosMap.has(a.id));
    this.logger.log(`[Comentador] Iniciando fila: ${pendentes.length} artigos pendentes de ${total} totais (concorrência=${concorrencia})`);

    let indice = 0;
    const executarProximo = async (): Promise<void> => {
      while (indice < pendentes.length) {
        const artigoAtual = pendentes[indice++];
        // Pacing suave para não bater no rate-limit por minuto
        await new Promise(r => setTimeout(r, 1500));
        await this.comentarArtigoIndividual(legislacaoId, artigoAtual, titulo, tipo);
        processados++;
        await this.supabaseService.upsertProcessamento(legislacaoId, 'comentarios', {
          status: 'processando',
          quantidade_total: total,
          quantidade_processada: processados,
        });
      }
    };

    // Lança workers concorrentes
    const workers = Array.from({ length: Math.min(concorrencia, pendentes.length) }, () => executarProximo());
    await Promise.all(workers);

    // Verifica se restou algum artigo com erro e faz uma segunda passada
    const artigosFinais = await this.supabaseService.listArtigosByLegislacao(legislacaoId);
    const comErro = artigosFinais.filter(art => {
      const comentarios = Array.isArray(art.legislacao_comentarios)
        ? art.legislacao_comentarios
        : art.legislacao_comentarios ? [art.legislacao_comentarios] : [];
      return !comentarios.some((c: any) => c.status === 'concluido');
    });

    if (comErro.length > 0) {
      this.logger.log(`[Comentador] 🔄 Retentando ${comErro.length} artigos que falharam na primeira passada...`);
      for (const art of comErro) {
        await new Promise(r => setTimeout(r, 1500));
        await this.comentarArtigoIndividual(legislacaoId, art, titulo, tipo);
      }
    }

    const artigosConcluidosFinais = await this.supabaseService.listArtigosByLegislacao(legislacaoId);
    const totalConcluidos = artigosConcluidosFinais.filter(art => {
      const comentarios = Array.isArray(art.legislacao_comentarios)
        ? art.legislacao_comentarios
        : art.legislacao_comentarios ? [art.legislacao_comentarios] : [];
      return comentarios.some((c: any) => c.status === 'concluido');
    }).length;

    await this.supabaseService.upsertProcessamento(legislacaoId, 'comentarios', {
      status: 'concluido',
      quantidade_total: total,
      quantidade_processada: totalConcluidos,
    });
  }

  /**
   * Helper para formatar datas variadas em formato ISO (YYYY-MM-DD)
   */
  private formatDateIso(dateStr?: string | null): string | null {
    if (!dateStr || typeof dateStr !== 'string') return null;
    const trimmed = dateStr.trim();
    if (/^\d{4}-\d{2}-\d{2}$/.test(trimmed)) return trimmed;
    const match = trimmed.match(/^(\d{1,2})[\/\.-](\d{1,2})[\/\.-](\d{4})$/);
    if (match) {
      const day = match[1].padStart(2, '0');
      const month = match[2].padStart(2, '0');
      const year = match[3];
      return `${year}-${month}-${day}`;
    }
    return null;
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
  // Retomar processamento de comentários para todos os artigos pendentes
  // ---------------------------------------------------------------
  async retomarProcessamentoComentarios(legislacaoId: string) {
    const legislacao = await this.supabaseService.getLegislacaoById(legislacaoId);
    if (!legislacao) throw new NotFoundException('Legislação não encontrada.');

    const artigos = await this.supabaseService.listArtigosByLegislacao(legislacaoId);
    if (!artigos || artigos.length === 0) {
      throw new NotFoundException('Nenhum artigo encontrado para esta legislação.');
    }

    this.logger.log(`[Retomada] Retomando comentários para legislação ${legislacaoId} (${artigos.length} artigos)...`);
    
    // Inicia em background
    this.processarComentariosEmFila(legislacaoId, artigos, legislacao.titulo, legislacao.tipo || '').then(async () => {
      await this.supabaseService.updateLegislacao(legislacaoId, { status: 'concluida' });
      await this.supabaseService.upsertProcessamento(legislacaoId, 'finalizacao', { status: 'concluido' });
      this.logger.log(`[Retomada] ✅ Legislação ${legislacaoId} concluída com sucesso.`);
    }).catch(err => {
      this.logger.error(`[Retomada] ❌ Erro ao retomar comentários para ${legislacaoId}: ${err.message}`);
    });

    return { message: 'Retomada de comentários iniciada em background.' };
  }

  // ---------------------------------------------------------------
  // Listagem e detalhes
  // ---------------------------------------------------------------
  async listarPorUsuario(userId: string) {
    const legislacoes = await this.supabaseService.listLegislacoesByUser(userId);
    if (!legislacoes || legislacoes.length === 0) return [];

    const legIds = legislacoes.map(l => l.id);
    const [processamentosMap, artigosLidosMap] = await Promise.all([
      this.supabaseService.getProcessamentosByLegislacoes(legIds),
      this.supabaseService.getAllArtigosLidosByUser(userId),
    ]);

    return legislacoes.map(leg => ({
      ...leg,
      processamentos: processamentosMap[leg.id] || [],
      artigos_lidos: artigosLidosMap[leg.id] || [],
    }));
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
  // Agente 3 — Analista Estratégico de Concursos (Legislação)
  // ---------------------------------------------------------------

  /**
   * Gera (ou regenera) a análise estratégica de concursos para uma legislação.
   * Transforma artigos e comentários em priorização, riscos e metas de questões/flashcards.
   */
  async gerarAnaliseEstrategica(legislacaoId: string, userId: string) {
    const legislacao = await this.supabaseService.getLegislacaoById(legislacaoId);
    if (!legislacao) throw new NotFoundException('Legislação não encontrada.');

    this.logger.log(`[Agente 3 - Analista] Iniciando análise estratégica para legislacaoId=${legislacaoId}, userId=${userId}`);

    await this.supabaseService.upsertAnaliseEstrategica(legislacaoId, userId, {
      status: 'processando',
      erro: null,
    });

    try {
      const artigosComComentarios = await this.supabaseService.listArtigosComComentarios(legislacaoId);
      if (!artigosComComentarios || artigosComComentarios.length === 0) {
        throw new Error('Nenhum artigo encontrado para esta legislação.');
      }

      const analiseJson = await this.langChainService.analisarEstrategiaConcurso(
        {
          id: legislacao.id,
          titulo: legislacao.titulo,
          tipo: legislacao.tipo,
          numero: legislacao.numero,
          ano: legislacao.ano,
          ementa: legislacao.ementa,
        },
        artigosComComentarios,
      );

      const analiseSalva = await this.supabaseService.upsertAnaliseEstrategica(legislacaoId, userId, {
        status: 'concluido',
        meta_global: analiseJson.meta_global || { meta_questoes_total: 0, meta_flashcards_total: 0 },
        analise_concurso: analiseJson.analise_concurso || [],
        comparacoes_recomendadas: analiseJson.comparacoes_recomendadas || [],
        erro: null,
      });

      this.logger.log(
        `[Agente 3 - Analista] ✅ Análise estratégica concluída: ${analiseJson.analise_concurso?.length ?? 0} artigos analisados. Meta global: ${analiseJson.meta_global?.meta_questoes_total ?? 0} questões.`,
      );

      return analiseSalva;
    } catch (err: any) {
      this.logger.error(`[Agente 3 - Analista] ❌ Erro na análise estratégica de ${legislacaoId}: ${err.message}`);
      await this.supabaseService.upsertAnaliseEstrategica(legislacaoId, userId, {
        status: 'erro',
        erro: err.message,
      });
      throw err;
    }
  }

  /**
   * Obtém a análise estratégica do Agente 3 para uma legislação e usuário.
   */
  async getAnaliseEstrategica(legislacaoId: string, userId: string) {
    return this.supabaseService.getAnaliseEstrategicaByLegislacao(legislacaoId, userId);
  }

  // ---------------------------------------------------------------
  // Agente 4 — Planejador e Gerenciador de Cronograma de Estudos
  // ---------------------------------------------------------------

  /**
   * Gera (ou regenera) o plano de cronograma para uma legislação.
   * Chama o Agente 4 com o contexto dos Agentes 1, 2 e 3.
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
    const legislacao = await this.supabaseService.getLegislacaoById(legislacaoId);
    if (!legislacao) throw new NotFoundException('Legislação não encontrada.');

    this.logger.log(`[Agente 4 - Planejador] Iniciando geração de plano para legislacaoId=${legislacaoId}, userId=${userId}`);

    await this.supabaseService.upsertPlanoLegislacao(legislacaoId, userId, {
      status: 'processando',
      preferencias: preferencias || {},
      erro: null,
    });

    try {
      const [artigosComComentarios, analiseEstrategica] = await Promise.all([
        this.supabaseService.listArtigosComComentarios(legislacaoId),
        this.supabaseService.getAnaliseEstrategicaByLegislacao(legislacaoId, userId),
      ]);

      if (!artigosComComentarios || artigosComComentarios.length === 0) {
        throw new Error('Nenhum artigo encontrado para esta legislação. O processamento inicial pode não ter sido concluído.');
      }

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
        analiseEstrategica,
      );

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

      this.logger.log(`[Agente 4 - Planejador] ✅ Plano gerado: ${planoJson.blocos?.length ?? 0} blocos, ${planoJson.sessoes?.length ?? 0} sessões.`);
      return planoSalvo;
    } catch (err: any) {
      this.logger.error(`[Agente 4 - Planejador] ❌ Erro ao gerar plano para ${legislacaoId}: ${err.message}`);
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

  // ---------------------------------------------------------------
  // Agente 5 — Gerador de Questões e Material de Fixação
  // ---------------------------------------------------------------

  /**
   * Gera (ou regenera) material completo de fixação e questões para uma legislação.
   * Cumpre as metas de questões e flashcards definidas pelo Agente 3.
   */
  async gerarMaterialConcurso(
    legislacaoId: string,
    userId: string,
    opcoes?: {
      sessao_id?: string;
      banca?: string;
      artigo_id?: string;
      artigos_filtro?: string[];
      modo?: 'adicionar' | 'substituir';
    },
  ) {
    const legislacao = await this.supabaseService.getLegislacaoById(legislacaoId);
    if (!legislacao) throw new NotFoundException('Legislação não encontrada.');

    const modo = opcoes?.modo || 'substituir';
    this.logger.log(`[Agente 5 - Fixação] Iniciando geração de material (modo=${modo}) para legislacaoId=${legislacaoId}, userId=${userId}`);

    // Se o modo for 'adicionar', busca o material prévio para mesclagem
    let materialExistente: any = null;
    if (modo === 'adicionar') {
      materialExistente = await this.supabaseService.getMaterialConcursoByLegislacao(legislacaoId, userId);
    }

    await this.supabaseService.upsertMaterialConcurso(legislacaoId, userId, {
      status: 'processando',
      parametros: opcoes || {},
      erro: null,
    });

    try {
      const [artigosComComentarios, analiseEstrategica] = await Promise.all([
        this.supabaseService.listArtigosComComentarios(legislacaoId),
        this.supabaseService.getAnaliseEstrategicaByLegislacao(legislacaoId, userId),
      ]);

      if (!artigosComComentarios || artigosComComentarios.length === 0) {
        throw new Error('Nenhum artigo encontrado para esta legislação.');
      }

      const materialJson = await this.langChainService.gerarMaterialFixacao(
        {
          id: legislacao.id,
          titulo: legislacao.titulo,
          tipo: legislacao.tipo,
          numero: legislacao.numero,
          ano: legislacao.ano,
          ementa: legislacao.ementa,
        },
        artigosComComentarios,
        analiseEstrategica,
        {
          ...opcoes,
          questoes_existentes: materialExistente?.questoes || [],
        },
      );

      const novasQuestoes = materialJson.conteudos?.questoes || materialJson.questoes || [];
      const novosFlashcards = materialJson.conteudos?.flashcards || materialJson.flashcards || [];
      const novosCasosPraticos = materialJson.conteudos?.casos_praticos || materialJson.casos_praticos || [];

      let questoesFinal = novasQuestoes;
      let flashcardsFinal = novosFlashcards;
      let casosPraticosFinal = novosCasosPraticos;
      let pegadinhasFinal = materialJson.pegadinhas || [];
      let pontosProvaFinal = materialJson.pontos_de_prova || [];
      let conceitosFinal = materialJson.conceitos_memorizacao || [];
      let comparacoesFinal = materialJson.comparacoes || [];

      if (modo === 'adicionar' && materialExistente) {
        const questoesAntigas = materialExistente.questoes || [];
        const flashcardsAntigos = materialExistente.flashcards || [];
        const casosAntigos = materialExistente.casos_praticos || [];

        // Renumera novas questões para IDs únicos sequenciais
        const novasQuestoesAjustadas = novasQuestoes.map((q: any, idx: number) => ({
          ...q,
          id: `q-${questoesAntigas.length + idx + 1}`,
        }));

        const novosFlashcardsAjustados = novosFlashcards.map((f: any, idx: number) => ({
          ...f,
          id: `fc-${flashcardsAntigos.length + idx + 1}`,
        }));

        questoesFinal = [...questoesAntigas, ...novasQuestoesAjustadas];
        flashcardsFinal = [...flashcardsAntigos, ...novosFlashcardsAjustados];
        casosPraticosFinal = [...casosAntigos, ...novosCasosPraticos];

        // Combina pegadinhas e pontos de prova sem duplicar
        const pegadinhasAntigas = materialExistente.pegadinhas || [];
        const pegadinhaTitulos = new Set(pegadinhasAntigas.map((p: any) => p.titulo || p.armadilha));
        pegadinhasFinal = [
          ...pegadinhasAntigas,
          ...(materialJson.pegadinhas || []).filter((p: any) => !pegadinhaTitulos.has(p.titulo || p.armadilha)),
        ];

        const pontosAntigos = materialExistente.pontos_de_prova || [];
        pontosProvaFinal = [...pontosAntigos, ...(materialJson.pontos_de_prova || [])];
        conceitosFinal = [...(materialExistente.conceitos_memorizacao || []), ...(materialJson.conceitos_memorizacao || [])];
        comparacoesFinal = [...(materialExistente.comparacoes || []), ...(materialJson.comparacoes || [])];
      }

      const totalArtigosComMaterial = new Set([
        ...questoesFinal.map((q: any) => String(q.artigo_numero || q.artigo_id)),
        ...flashcardsFinal.map((f: any) => String(f.artigo_numero || f.artigo_id)),
      ]).size;

      const materialSalvo = await this.supabaseService.upsertMaterialConcurso(legislacaoId, userId, {
        status: 'concluido',
        questoes: questoesFinal,
        flashcards: flashcardsFinal,
        casos_praticos: casosPraticosFinal,
        pontos_de_prova: pontosProvaFinal,
        pegadinhas: pegadinhasFinal,
        conceitos_memorizacao: conceitosFinal,
        comparacoes: comparacoesFinal,
        metas: {
          questoes_planejadas: materialJson.metas?.questoes_planejadas || questoesFinal.length,
          questoes_geradas: questoesFinal.length,
          flashcards_planejados: materialJson.metas?.flashcards_planejados || flashcardsFinal.length,
          flashcards_gerados: flashcardsFinal.length,
        },
        cobertura: {
          total_artigos_elegiveis: artigosComComentarios.length,
          artigos_com_material: totalArtigosComMaterial,
          artigos_sem_material: Math.max(0, artigosComComentarios.length - totalArtigosComMaterial),
          percentual_cobertura: Math.min(100, Math.round((totalArtigosComMaterial / artigosComComentarios.length) * 100)),
        },
        resumo: {
          total_questoes: questoesFinal.length,
          total_flashcards: flashcardsFinal.length,
          total_casos_praticos: casosPraticosFinal.length,
        },
        alertas: materialJson.alertas || [],
        parametros: opcoes || {},
        erro: null,
      });

      this.logger.log(
        `[Agente 5 - Fixação] ✅ Material salvo com sucesso (modo=${modo}) para ${legislacaoId}: ` +
        `Total consolidado: ${questoesFinal.length} questões, ${flashcardsFinal.length} flashcards.`,
      );

      return materialSalvo;
    } catch (err: any) {
      this.logger.error(`[Agente 5 - Fixação] ❌ Erro ao gerar material para ${legislacaoId}: ${err.message}`);
      await this.supabaseService.upsertMaterialConcurso(legislacaoId, userId, {
        status: 'erro',
        erro: err.message,
      });
      throw err;
    }
  }

  /**
   * Obtém o material de concurso/fixação de uma legislação para um determinado usuário.
   */
  async getMaterialConcurso(legislacaoId: string, userId: string) {
    return this.supabaseService.getMaterialConcursoByLegislacao(legislacaoId, userId);
  }
}



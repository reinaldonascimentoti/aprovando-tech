import { Injectable, Logger, Optional } from '@nestjs/common';
import { createClient, SupabaseClient } from '@supabase/supabase-js';
import * as ws from 'ws';
import { EditalUserContext } from '../modules/editais/editais.types';
import { LogStreamService } from '../modules/questions/log-stream.service';

@Injectable()
export class SupabaseService {
  private readonly logger = new Logger(SupabaseService.name);
  private client: SupabaseClient | null = null;
  private adminClient: SupabaseClient | null = null;
  private isConfigured = false;

  constructor(@Optional() private readonly logStreamService?: LogStreamService) {
    const supabaseUrl = process.env.SUPABASE_URL;
    const anonKey = process.env.SUPABASE_ANON_KEY;
    const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

    if (supabaseUrl && anonKey && serviceRoleKey &&
        !supabaseUrl.includes('xyz-aprovando')) {
      try {
        const realtime = { transport: ws as any };

        // Cliente padrão com anon key (para autenticação de usuários)
        this.client = createClient(supabaseUrl, anonKey, {
          auth: { persistSession: false, autoRefreshToken: false },
          realtime,
        });

        // Cliente admin com service_role (para operações privilegiadas no backend)
        this.adminClient = createClient(supabaseUrl, serviceRoleKey, {
          auth: { persistSession: false, autoRefreshToken: false },
          realtime,
        });

        this.isConfigured = true;
        this.logger.log('✅ Conectado ao Supabase (real)');
      } catch (e) {
        this.logger.error(`Falha ao inicializar Supabase: ${e.message}`);
      }
    } else {
      this.logger.warn(
        '⚠️  SUPABASE não configurado. Defina SUPABASE_URL, SUPABASE_ANON_KEY e SUPABASE_SERVICE_ROLE_KEY no .env',
      );
    }
  }

  getIsConfigured(): boolean {
    return this.isConfigured;
  }

  /** Cliente anon (para autenticação de usuários) */
  getClient(): SupabaseClient | null {
    return this.client;
  }

  /** Cliente service_role (para operações admin no backend) */
  getAdminClient(): SupabaseClient | null {
    return this.adminClient;
  }

  // ----------------------------------------------------------------
  // UTILITIES (helpers)
  // ----------------------------------------------------------------

  /** Converte string para Title Case: "BANCO DE DADOS" → "Banco de Dados" */
  private toTitleCase(str: string): string {
    return str
      .toLowerCase()
      .replace(/\b\w/g, (c) => c.toUpperCase());
  }

  // ----------------------------------------------------------------
  // USERS / PROFILES
  // ----------------------------------------------------------------

  async getUsers() {
    if (!this.adminClient) return [];

    const { data, error } = await this.adminClient
      .from('profiles')
      .select('id, email, full_name, role, created_at')
      .order('created_at', { ascending: false });

    if (error) {
      this.logger.error(`getUsers error: ${error.message}`);
      return [];
    }
    return data ?? [];
  }

  async updateUserRole(id: string, role: string) {
    if (!this.adminClient) return null;

    // Atualiza role no profile
    const { data, error } = await this.adminClient
      .from('profiles')
      .update({ role })
      .eq('id', id)
      .select()
      .single();

    if (error) {
      this.logger.error(`updateUserRole error: ${error.message}`);
      return null;
    }

    // Atualiza app_metadata (usado para autorização via JWT)
    await this.adminClient.auth.admin.updateUserById(id, {
      app_metadata: { role },
    });

    return data;
  }

  async deleteUser(id: string): Promise<boolean> {
    if (!this.adminClient || !id) return false;

    try {
      // 1. Limpa tabelas dependentes
      await this.adminClient.from('user_topic_progress').delete().eq('user_id', id);
      await this.adminClient.from('user_edital_assignments').delete().eq('user_id', id);
      await this.adminClient.from('user_edital_dismissals').delete().eq('user_id', id);
      await this.adminClient.from('profiles').delete().eq('id', id);

      // 2. Exclui do Supabase Auth (auth.users)
      const { error } = await this.adminClient.auth.admin.deleteUser(id);
      if (error) {
        this.logger.error(`deleteUser auth error for ${id}: ${error.message}`);
        return false;
      }

      this.logger.log(`deleteUser: Usuário ${id} excluído com sucesso do Auth e tabelas associadas.`);
      return true;
    } catch (e: any) {
      this.logger.error(`deleteUser exception for ${id}: ${e?.message}`);
      return false;
    }
  }

  // ----------------------------------------------------------------
  // QUESTIONS
  // ----------------------------------------------------------------

  async getQuestions(isReleasedOnly = false) {
    if (!this.adminClient) return [];

    const BATCH_SIZE = 1000;
    const allData: any[] = [];
    let from = 0;
    let hasMore = true;

    while (hasMore) {
      let query = this.adminClient
        .from('questoes')
        .select('*')
        .order('created_at', { ascending: false })
        .range(from, from + BATCH_SIZE - 1);

      if (isReleasedOnly) {
        query = query.eq('is_released', true);
      }

      const { data, error } = await query;

      if (error) {
        this.logger.error(`getQuestions error (range ${from}-${from + BATCH_SIZE - 1}): ${error.message}`);
        break;
      }

      if (!data || data.length === 0) {
        hasMore = false;
      } else {
        allData.push(...data);
        if (data.length < BATCH_SIZE) {
          hasMore = false;
        } else {
          from += BATCH_SIZE;
        }
      }
    }

    this.logger.log(`getQuestions: ${allData.length} questões carregadas (isReleasedOnly=${isReleasedOnly})`);
    return allData.map((question) => this.toQuestionResponse(question));
  }

  async getQualityAnalysis() {
    const questions = await this.getQuestions(false);
    return this.generateQualityReport(questions);
  }

  async toggleQuestionRelease(id: string) {
    if (!this.adminClient) return null;

    const isIdNumeric = !isNaN(Number(id));
    let selectQuery = this.adminClient.from('questoes').select('is_released');
    if (isIdNumeric) {
      selectQuery = selectQuery.eq('id', Number(id));
    } else {
      selectQuery = selectQuery.eq('id_qc', id);
    }

    const { data: current } = await selectQuery.single();
    if (!current) return null;

    let updateQuery = this.adminClient
      .from('questoes')
      .update({ is_released: !current.is_released });
    if (isIdNumeric) {
      updateQuery = updateQuery.eq('id', Number(id));
    } else {
      updateQuery = updateQuery.eq('id_qc', id);
    }

    const { data, error } = await updateQuery.select().single();

    if (error) {
      this.logger.error(`toggleQuestionRelease error: ${error.message}`);
      return null;
    }
    return this.toQuestionResponse(data);
  }

  async updateQuestion(id: string, updateData: any) {
    if (!this.adminClient || !id) return null;

    const payload: any = {};

    if (updateData.disciplina !== undefined) payload.disciplina = updateData.disciplina ? String(updateData.disciplina).toUpperCase().trim() : 'GERAL';
    if (updateData.banca !== undefined) payload.banca = updateData.banca || null;
    if (updateData.ano !== undefined) payload.ano = updateData.ano ? Number(updateData.ano) : null;
    if (updateData.orgao !== undefined) payload.orgao = updateData.orgao || null;
    if (updateData.cargo !== undefined) payload.cargo = updateData.cargo || null;
    if (updateData.assunto !== undefined) payload.assunto = updateData.assunto || null;
    if (updateData.tipo !== undefined) payload.tipo = updateData.tipo === 'certo_errado' ? 'certo_errado' : 'multipla_escolha';
    if (updateData.enunciado !== undefined) payload.enunciado = updateData.enunciado;
    if (updateData.alternativas !== undefined) payload.alternativas = Array.isArray(updateData.alternativas) ? updateData.alternativas : [];
    if (updateData.resposta_correta !== undefined) payload.resposta_correta = updateData.resposta_correta || null;
    // Aceita `justificativa` como alias de `gabarito_comentado`
    if (updateData.justificativa !== undefined) payload.gabarito_comentado = updateData.justificativa || null;
    if (updateData.gabarito_comentado !== undefined) payload.gabarito_comentado = updateData.gabarito_comentado || null;
    if (updateData.imagem_url !== undefined) payload.imagem_url = updateData.imagem_url || null;
    if (updateData.is_released !== undefined) payload.is_released = !!updateData.is_released;

    const isIdNumeric = !isNaN(Number(id));
    let query = this.adminClient.from('questoes').update(payload);
    if (isIdNumeric) {
      query = query.eq('id', Number(id));
    } else {
      query = query.eq('id_qc', id);
    }

    const { data, error } = await query.select().single();
    if (error) {
      this.logger.error(`updateQuestion error: ${error.message}`);
      return null;
    }
    return this.toQuestionResponse(data);
  }

  async deleteQuestion(id: string) {
    if (!this.adminClient || !id) return false;

    const isIdNumeric = !isNaN(Number(id));
    let query = this.adminClient.from('questoes').delete();
    if (isIdNumeric) {
      query = query.eq('id', Number(id));
    } else {
      query = query.eq('id_qc', id);
    }

    const { error } = await query;
    if (error) {
      this.logger.error(`deleteQuestion error: ${error.message}`);
      return false;
    }
    return true;
  }

  async importJsonQuestions(questions: any[]) {
    if (!this.adminClient || !Array.isArray(questions)) return [];

    const rows = questions
      .map((q, idx) => {
        if (!q || typeof q !== 'object') return null;

        let id_qc = q.id_qc || q.id || q.codigo || null;
        if (!id_qc) {
          id_qc = `Q_IMP_${Date.now()}_${idx}_${Math.random().toString(36).substring(2, 6)}`;
        }

        const enunciado = q.enunciado || q.statement || q.texto || q.pergunta || q.question || null;
        if (!enunciado || typeof enunciado !== 'string' || !enunciado.trim()) return null;

        let tipo = 'multipla_escolha';
        const rawTipo = String(q.tipo || '').toLowerCase();
        if (rawTipo === 'certo_errado' || rawTipo === 'certo/errado' || rawTipo === 'ce' || rawTipo === 'tf') {
          tipo = 'certo_errado';
        }

        const disciplinaRaw = q.disciplina || q.subject || q.materia || 'GERAL';
        const disciplina = String(disciplinaRaw).toUpperCase().trim();
        const assunto = q.assunto || q.tema || q.topic || null;
        const alternativas = Array.isArray(q.alternativas) ? q.alternativas : (Array.isArray(q.options) ? q.options : []);
        const resposta_correta = q.resposta_correta ? String(q.resposta_correta).toUpperCase() : (q.correct_option ? String(q.correct_option).toUpperCase() : null);
        // Aceita `justificativa` como alias de `gabarito_comentado`
        const gabarito_comentado = q.justificativa || q.gabarito_comentado || q.explanation || q.explicacao || null;
        const imagem_url = q.imagem_url || null;
        const imagens = Array.isArray(q.imagens) ? q.imagens : (imagem_url ? [imagem_url] : []);

        // Sanitização segura do ano para PostgreSQL integer check (1900..2100)
        let ano: number | null = null;
        if (q.ano !== undefined && q.ano !== null) {
          const parsedAno = Number(q.ano);
          if (!isNaN(parsedAno) && parsedAno >= 1900 && parsedAno <= 2100) {
            ano = Math.floor(parsedAno);
          }
        }

        return {
          id_qc: String(id_qc),
          disciplina: String(disciplina),
          banca: q.banca ? String(q.banca) : null,
          ano,
          orgao: q.orgao ? String(q.orgao) : null,
          cargo: q.cargo ? String(q.cargo) : null,
          assunto: assunto ? String(assunto) : null,
          tipo,
          enunciado: String(enunciado),
          alternativas,
          resposta_correta,
          gabarito_comentado: gabarito_comentado ? String(gabarito_comentado) : null,
          imagem_url: imagem_url ? String(imagem_url) : null,
          imagens,
          quality_metrics: q.quality_metrics || {
            clarity_score: 9.5,
            distractor_plausibility: 9.0,
            bloom_taxonomy: 'Aplicação',
            difficulty_level: 'Médio',
            overall_quality_score: 9.3,
            quality_comments: 'Questão importada com sucesso via JSON.',
          },
          is_released: true,
        };
      })
      .filter((row): row is NonNullable<typeof row> => row !== null);

    // Remove duplicatas de id_qc dentro do próprio conjunto a ser inserido
    const uniqueRowsMap = new Map<string, any>();
    for (const r of rows) {
      uniqueRowsMap.set(r.id_qc, r);
    }
    const uniqueRows = Array.from(uniqueRowsMap.values());

    const batchSize = 100;
    const allResults: any[] = [];

    for (let i = 0; i < uniqueRows.length; i += batchSize) {
      const chunk = uniqueRows.slice(i, i + batchSize);
      let res = await this.adminClient
        .from('questoes')
        .upsert(chunk, { onConflict: 'id_qc' })
        .select();

      if (!res.error && res.data) {
        allResults.push(...res.data);
        if (this.logStreamService) {
          this.logStreamService.pushLog(`Lote ${Math.floor(i / batchSize) + 1} processado: +${res.data.length} questões.`, 'info');
        }
      } else {
        this.logger.warn(`Aviso no lote ${Math.floor(i / batchSize) + 1}: ${res.error?.message}. Executando inserção item a item...`);
        if (this.logStreamService) {
          this.logStreamService.pushLog(`Aviso no lote ${Math.floor(i / batchSize) + 1}. Tentando modo individual...`, 'warn');
        }

        // Tenta individualmente para cada questão do lote com falha
        for (const singleRow of chunk) {
          const singleRes = await this.adminClient
            .from('questoes')
            .upsert([singleRow], { onConflict: 'id_qc' })
            .select();

          if (!singleRes.error && singleRes.data && singleRes.data.length > 0) {
            allResults.push(singleRes.data[0]);
          } else {
            this.logger.error(`Erro ao importar questão ${singleRow.id_qc}: ${singleRes.error?.message}`);
            if (this.logStreamService) {
              this.logStreamService.pushLog(`Falha na questão ${singleRow.id_qc}: ${singleRes.error?.message}`, 'error');
            }
          }
        }
      }
    }

    this.logger.log(`importJsonQuestions: ${allResults.length}/${uniqueRows.length} questões processadas com sucesso.`);
    if (this.logStreamService) {
      this.logStreamService.pushLog(`Finalizado: ${allResults.length}/${uniqueRows.length} questões salvas no Supabase.`, 'success');
    }
    return allResults.map((question) => this.toQuestionResponse(question));
  }

  async addExtractedQuestions(pdfName: string, questions: any[]) {
    if (!this.adminClient) return [];
    return this.importJsonQuestions(
      questions.map((q) => ({ ...q, prova: q.prova || pdfName })),
    );
  }

  // ----------------------------------------------------------------
  // EDITAIS
  // ----------------------------------------------------------------

  async getEditais(userId?: string) {
    if (!this.adminClient) return [];

    // Se userId fornecido, busca apenas os editais que o usuário explicitamente adicionou
    if (userId) {
      const { data: assignments, error: assignErr } = await this.adminClient
        .from('user_edital_assignments')
        .select('edital_id')
        .eq('user_id', userId);

      if (assignErr) {
        this.logger.error(`getEditais (assignments) error: ${assignErr.message}`);
        return [];
      }

      const assignedIds = (assignments ?? []).map((a: any) => a.edital_id);

      // Usuário não possui nenhum edital adicionado ainda
      if (assignedIds.length === 0) return [];

      const { data, error } = await this.adminClient
        .from('editais')
        .select('*')
        .in('id', assignedIds)
        .order('created_at', { ascending: false });

      if (error) {
        this.logger.error(`getEditais error: ${error.message}`);
        return [];
      }
      return data ?? [];
    }

    // Sem userId: retorna todos (admin / listagem pública)
    const { data, error } = await this.adminClient
      .from('editais')
      .select('*')
      .order('created_at', { ascending: false });

    if (error) {
      this.logger.error(`getEditais error: ${error.message}`);
      return [];
    }
    return data ?? [];
  }

  async updateEditalContext(id: string, userContext: EditalUserContext) {
    if (!this.adminClient) return null;

    const updatePayload: any = {
      cargo: userContext.cargo || null,
      concurso: userContext.concurso || null,
      data_prova: userContext.dataProva || null,
      horas_por_dia: userContext.horasPorDia || null,
      dias_por_semana: userContext.diasPorSemana || null,
    };

    if (userContext.title && userContext.title.trim().length > 0) {
      updatePayload.title = userContext.title.trim();
    }

    const { data, error } = await this.adminClient
      .from('editais')
      .update(updatePayload)
      .eq('id', id)
      .select()
      .single();

    if (error) {
      this.logger.error(`updateEditalContext error: ${error.message}`);
      return null;
    }
    return data;
  }

  async dismissEdital(editalId: string, userId: string) {
    if (!this.adminClient) return null;

    // Primeiro remove da lista de assinalados (se estiver lá)
    await this.adminClient
      .from('user_edital_assignments')
      .delete()
      .eq('user_id', userId)
      .eq('edital_id', editalId);

    const { data, error } = await this.adminClient
      .from('user_edital_dismissals')
      .insert({ user_id: userId, edital_id: editalId })
      .select()
      .single();

    if (error) {
      // Ignora duplicatas (já dispensado)
      if (error.code === '23505') return { already_dismissed: true };
      this.logger.error(`dismissEdital error: ${error.message}`);
      return null;
    }
    return data;
  }

  async deleteEdital(editalId: string) {
    if (!this.adminClient) return false;

    const { error } = await this.adminClient
      .from('editais')
      .delete()
      .eq('id', editalId);

    if (error) {
      this.logger.error(`deleteEdital error: ${error.message}`);
      return false;
    }

    return true;
  }

  async getEditalById(id: string) {
    if (!this.adminClient) return null;

    const { data, error } = await this.adminClient
      .from('editais')
      .select('*')
      .eq('id', id)
      .single();

    if (error) {
      this.logger.warn(`getEditalById (${id}) not found: ${error.message}`);
      return null;
    }

    // Tenta buscar também na tabela dedicada conteudo_programatico se existir
    try {
      const { data: cpData } = await this.adminClient
        .from('conteudo_programatico')
        .select('*')
        .eq('edital_id', id)
        .maybeSingle();

      if (cpData && data) {
        if (!data.pareto_data) data.pareto_data = {};
        if (typeof data.pareto_data === 'string') {
          try { data.pareto_data = JSON.parse(data.pareto_data); } catch (e) {}
        }
        data.pareto_data.mapa_geral = cpData.mapa_geral || data.pareto_data.mapa_geral;
        data.pareto_data.conteudo_programatico = cpData.raw_json || data.pareto_data.conteudo_programatico;
      }
    } catch (e) {
      // Tabela conteudo_programatico opcional se ainda não criada
    }

    return data;
  }

  async addEdital(title: string, uploadedBy: string, paretoData: any, userContext?: EditalUserContext) {
    if (!this.adminClient) return null;

    // Busca nome do uploader
    const { data: profile } = await this.adminClient
      .from('profiles')
      .select('full_name')
      .eq('id', uploadedBy)
      .single();

    const uploaderName = profile?.full_name ?? 'Usuário';

    const { data, error } = await this.adminClient
      .from('editais')
      .insert({
        title,
        storage_path: `editais/${title.toLowerCase().replace(/\s+/g, '-')}.pdf`,
        uploaded_by: uploadedBy,
        uploader_name: uploaderName,
        status: 'completed',
        pareto_data: paretoData,
        cargo: userContext?.cargo || null,
        concurso: userContext?.concurso || null,
        data_prova: userContext?.dataProva || null,
        horas_por_dia: userContext?.horasPorDia || null,
        dias_por_semana: userContext?.diasPorSemana || null,
      })
      .select()
      .single();

    if (error) {
      this.logger.error(`addEdital error: ${error.message}`);
      return null;
    }

    // Salva também na tabela dedicada conteudo_programatico
    if (data?.id && paretoData) {
      try {
        await this.adminClient
          .from('conteudo_programatico')
          .upsert({
            edital_id: data.id,
            cargo: userContext?.cargo || null,
            concurso: userContext?.concurso || null,
            mapa_geral: paretoData.mapa_geral || paretoData.mapa_completo || paretoData.mapa_geral_extraido || {},
            raw_json: paretoData.conteudo_programatico || paretoData
          }, { onConflict: 'edital_id' });
      } catch (e) {
        this.logger.warn(`Salvamento opcional na tabela conteudo_programatico: ${e.message}`);
      }
    }

    // Cria automaticamente um user_edital_assignment para o uploader,
    // garantindo que o edital apareça em "Meus Editais" imediatamente.
    if (data?.id && uploadedBy) {
      try {
        await this.adminClient
          .from('user_edital_assignments')
          .upsert({
            user_id: uploadedBy,
            edital_id: data.id,
            assigned_at: new Date().toISOString(),
          }, { onConflict: 'user_id,edital_id' });
      } catch (e) {
        this.logger.warn(`Criação automática de user_edital_assignment falhou: ${e?.message ?? e}`);
      }
    }

    return data;
  }

  // ----------------------------------------------------------------
  // SEND EDITAL TO USER (Admin → User assignment)
  // ----------------------------------------------------------------

  async sendEditalToUser(editalId: string, userId: string) {
    if (!this.adminClient) return null;

    // Verifica se o edital existe
    const edital = await this.getEditalById(editalId);
    if (!edital) return null;

    // Verifica se já existe atribuição (evita duplicidade)
    const { data: existing } = await this.adminClient
      .from('user_edital_assignments')
      .select('id')
      .eq('user_id', userId)
      .eq('edital_id', editalId)
      .maybeSingle();

    if (existing) {
      this.logger.log(`Edital ${editalId} já atribuído ao usuário ${userId}`);
      return { already_assigned: true, edital };
    }

    const { data, error } = await this.adminClient
      .from('user_edital_assignments')
      .insert({
        user_id: userId,
        edital_id: editalId,
        assigned_at: new Date().toISOString(),
      })
      .select()
      .single();

    if (error) {
      this.logger.error(`sendEditalToUser error: ${error.message}`);
      // Fallback: a tabela user_edital_assignments pode não existir.
      // Nesse caso, fazemos a associação indiretamente via user_topic_progress.
      this.logger.warn('Tentando associação via user_topic_progress como fallback...');

      // Cria um registro de progresso inicial para o primeiro sprint/tópico
      if (edital.pareto_data?.sprints?.[0]?.topics?.[0]) {
        const firstTopicId = edital.pareto_data.sprints[0].topics[0].id;
        const { data: fallback } = await this.adminClient
          .from('user_topic_progress')
          .insert({
            user_id: userId,
            edital_id: editalId,
            topic_id: firstTopicId,
            completed: false,
          })
          .select()
          .single();

        return { fallback_assignment: true, data: fallback, edital };
      }

      return null;
    }

    return { assigned: true, data, edital };
  }

  // ----------------------------------------------------------------
  // USER TOPIC PROGRESS
  // ----------------------------------------------------------------

  async toggleTopicCompletion(editalId: string, topicId: string, userId: string) {
    if (!this.adminClient) return null;

    // Busca estado atual do tópico
    const { data: existing } = await this.adminClient
      .from('user_topic_progress')
      .select('id, completed')
      .eq('user_id', userId)
      .eq('edital_id', editalId)
      .eq('topic_id', topicId)
      .single();

    const newCompleted = existing ? !existing.completed : true;

    if (existing) {
      await this.adminClient
        .from('user_topic_progress')
        .update({ completed: newCompleted })
        .eq('id', existing.id);
    } else {
      await this.adminClient
        .from('user_topic_progress')
        .insert({ user_id: userId, edital_id: editalId, topic_id: topicId, completed: newCompleted });
    }

    // Retorna o edital com progresso calculado dinamicamente
    return this.getEditalWithProgress(editalId, userId);
  }

  async getEditalWithProgress(editalId: string, userId: string) {
    const edital = await this.getEditalById(editalId);
    if (!edital || !edital.pareto_data) return edital;

    // Busca todos os tópicos concluídos pelo usuário para este edital
    const { data: progress } = await this.adminClient!
      .from('user_topic_progress')
      .select('topic_id, completed')
      .eq('user_id', userId)
      .eq('edital_id', editalId);

    const completedMap = new Map<string, boolean>(
      (progress ?? []).map((p: any) => [p.topic_id, p.completed]),
    );

    // Aplica progresso aos sprints do pareto_data
    const paretoData = edital.pareto_data;
    if (paretoData.sprints) {
      for (const sprint of paretoData.sprints) {
        for (const topic of sprint.topics) {
          topic.completed = completedMap.get(topic.id) ?? false;
        }
        const total = sprint.topics.length;
        const done = sprint.topics.filter((t: any) => t.completed).length;
        sprint.progress = total > 0 ? Math.round((done / total) * 100) : 0;
      }
    }

    return { ...edital, pareto_data: paretoData };
  }

  // ----------------------------------------------------------------
  // UTILITIES
  // ----------------------------------------------------------------

  private toQuestionResponse(question: any) {
    const gabaritoComentado = question.gabarito_comentado || null;
    return {
      id: question.id,
      id_qc: question.id_qc,
      disciplina: question.disciplina || 'Geral',
      banca: question.banca || null,
      ano: question.ano || null,
      orgao: question.orgao || null,
      cargo: question.cargo || null,
      assunto: question.assunto || null,
      tipo: question.tipo,
      enunciado: question.enunciado,
      alternativas: question.alternativas || [],
      resposta_correta: question.resposta_correta || null,
      // gabarito_comentado mantido para retrocompatibilidade
      gabarito_comentado: gabaritoComentado,
      // justificativa é alias de gabarito_comentado na resposta
      justificativa: gabaritoComentado,
      imagem_url: question.imagem_url || null,
      imagens: question.imagens || [],
      quality_metrics: question.quality_metrics || {},
      is_released: question.is_released ?? true,
      created_at: question.created_at,
      updated_at: question.updated_at,
    };
  }

  private generateQualityReport(questions: any[]) {
    const total = questions.length;
    let sumClarity = 0;
    let sumDistractor = 0;
    let sumOverall = 0;

    const taxonomyDistribution: { [key: string]: number } = {};
    const difficultyDistribution: { [key: string]: number } = {};

    const detailed = questions.map((q) => {
      const qm = q.quality_metrics || {
        clarity_score: 9.0,
        distractor_plausibility: 8.5,
        bloom_taxonomy: 'Compreensão',
        difficulty_level: 'Médio',
        overall_quality_score: 9.0,
        quality_comments: 'Questão bem formulada.',
      };

      sumClarity += qm.clarity_score || 9;
      sumDistractor += qm.distractor_plausibility || 8.5;
      sumOverall += qm.overall_quality_score || 9;

      const tax = qm.bloom_taxonomy || 'Compreensão';
      taxonomyDistribution[tax] = (taxonomyDistribution[tax] || 0) + 1;

      const diff = qm.difficulty_level || 'Médio';
      difficultyDistribution[diff] = (difficultyDistribution[diff] || 0) + 1;

      return {
        id: q.id,
        pdf_name: q.pdf_name,
        subject: q.subject,
        topic: q.topic,
        statement_snippet: (q.statement || '').substring(0, 100) + '...',
        quality_metrics: qm,
      };
    });

    return {
      generated_at: new Date().toISOString(),
      total_questions_analyzed: total,
      average_metrics: {
        avg_clarity_score: total > 0 ? Number((sumClarity / total).toFixed(2)) : 0,
        avg_distractor_plausibility: total > 0 ? Number((sumDistractor / total).toFixed(2)) : 0,
        avg_overall_quality_score: total > 0 ? Number((sumOverall / total).toFixed(2)) : 0,
      },
      bloom_taxonomy_breakdown: taxonomyDistribution,
      difficulty_distribution: difficultyDistribution,
      detailed_questions_quality: detailed,
    };
  }

  /** Retorna estatísticas públicas do banco de dados (total de editais, questões e candidatos) */
  async getPublicStats() {
    try {
      const clientToUse = this.adminClient || this.client;
      if (!clientToUse) {
        return { editaisCount: 0, questoesCount: 0, candidatosCount: 0 };
      }

      const [editaisRes, questoesRes, profilesRes] = await Promise.all([
        clientToUse.from('editais').select('id', { count: 'exact', head: true }),
        clientToUse.from('questoes').select('id', { count: 'exact', head: true }),
        clientToUse.from('profiles').select('id', { count: 'exact', head: true }),
      ]);

      return {
        editaisCount: editaisRes.count ?? 0,
        questoesCount: questoesRes.count ?? 0,
        candidatosCount: profilesRes.count ?? 0,
      };
    } catch (err: any) {
      this.logger.error(`getPublicStats error: ${err?.message}`);
      return { editaisCount: 0, questoesCount: 0, candidatosCount: 0 };
    }
  }

  // ----------------------------------------------------------------
  // EDITAIS RECENTES GLOBAIS (para o bloco "Recentes" no dashboard)
  // ----------------------------------------------------------------

  /**
   * Retorna os N últimos editais com status 'completed' que o userId
   * ainda NÃO adicionou ao seu perfil (via user_edital_assignments).
   * Se userId não for fornecido, retorna os N mais recentes globalmente.
   */
  async getRecentCompletedEditais(limit = 4, userId?: string): Promise<any[]> {
    if (!this.adminClient) return [];

    // IDs já adicionados e dispensados pelo user
    let excludeIds: string[] = [];
    if (userId) {
      const [{ data: assigned }, { data: dismissed }] = await Promise.all([
        this.adminClient
          .from('user_edital_assignments')
          .select('edital_id')
          .eq('user_id', userId),
        this.adminClient
          .from('user_edital_dismissals')
          .select('edital_id')
          .eq('user_id', userId)
      ]);
      const aIds = (assigned ?? []).map((a: any) => a.edital_id);
      const dIds = (dismissed ?? []).map((d: any) => d.edital_id);
      excludeIds = [...aIds, ...dIds];
    }

    let query = this.adminClient
      .from('editais')
      .select('id, title, cargo, concurso, data_prova, uploader_name, created_at, status, pareto_data')
      .eq('status', 'completed')
      .order('created_at', { ascending: false })
      .limit(limit + excludeIds.length + 10); // busca extra para compensar exclusão

    const { data, error } = await query;
    if (error) {
      this.logger.error(`getRecentCompletedEditais error: ${error.message}`);
      return [];
    }

    let results = data ?? [];
    if (excludeIds.length > 0) {
      results = results.filter(e => !excludeIds.includes(e.id));
    }

    return results.slice(0, limit);
  }

  // ----------------------------------------------------------------
  // USER SCHEDULES (Cronograma personalizado por user + edital)
  // ----------------------------------------------------------------

  /** Busca o cronograma de um user para um edital específico */
  async getUserSchedule(userId: string, editalId: string) {
    if (!this.adminClient) return null;

    const { data, error } = await this.adminClient
      .from('user_schedules')
      .select('*')
      .eq('user_id', userId)
      .eq('edital_id', editalId)
      .maybeSingle();

    if (error) {
      this.logger.error(`getUserSchedule error: ${error.message}`);
      return null;
    }
    return data;
  }

  /** Busca todos os cronogramas de um user */
  async getUserSchedules(userId: string) {
    if (!this.adminClient) return [];

    const { data, error } = await this.adminClient
      .from('user_schedules')
      .select('*')
      .eq('user_id', userId)
      .order('created_at', { ascending: false });

    if (error) {
      this.logger.error(`getUserSchedules error: ${error.message}`);
      return [];
    }
    return data ?? [];
  }

  /** Cria ou atualiza o cronograma do user para um edital */
  async upsertUserSchedule(
    userId: string,
    editalId: string,
    payload: { horas_por_dia?: number; dias_por_semana?: number; data_prova?: string },
  ) {
    if (!this.adminClient) return null;

    const { data, error } = await this.adminClient
      .from('user_schedules')
      .upsert(
        {
          user_id: userId,
          edital_id: editalId,
          horas_por_dia: payload.horas_por_dia ?? null,
          dias_por_semana: payload.dias_por_semana ?? null,
          data_prova: payload.data_prova ?? null,
          updated_at: new Date().toISOString(),
        },
        { onConflict: 'user_id,edital_id' },
      )
      .select()
      .single();

    if (error) {
      this.logger.error(`upsertUserSchedule error: ${error.message}`);
      return null;
    }
    return data;
  }

  /** Remove o cronograma do user para um edital */
  async deleteUserSchedule(userId: string, editalId: string) {
    if (!this.adminClient) return false;

    const { error } = await this.adminClient
      .from('user_schedules')
      .delete()
      .eq('user_id', userId)
      .eq('edital_id', editalId);

    if (error) {
      this.logger.error(`deleteUserSchedule error: ${error.message}`);
      return false;
    }
    return true;
  }

  // ----------------------------------------------------------------
  // LEGISLAÇÕES — Comentador de Legislação
  // ----------------------------------------------------------------

  async createLegislacao(data: {
    user_id: string;
    titulo: string;
    tipo?: string;
    numero?: string;
    ano?: number;
    fonte?: string;
    ramo_direito?: string;
  }) {
    if (!this.adminClient) return null;
    const { data: row, error } = await this.adminClient
      .from('legislacoes')
      .insert({
        user_id: data.user_id,
        titulo: data.titulo,
        tipo: data.tipo || null,
        numero: data.numero || null,
        ano: data.ano || null,
        fonte: data.fonte || null,
        ramo_direito: data.ramo_direito || null,
        status: 'pendente',
      })
      .select()
      .single();
    if (error) { this.logger.error(`createLegislacao error: ${error.message}`); return null; }
    
    // Assinala automaticamente ao criador
    if (row?.id && row.user_id) {
      try {
        await this.adminClient.from('user_legislacao_assignments').upsert({
          user_id: row.user_id,
          legislacao_id: row.id,
        }, { onConflict: 'user_id,legislacao_id' });
      } catch (e) {
        this.logger.warn(`createLegislacao - falha no auto-assign: ${e.message}`);
      }
    }
    
    return row;
  }

  async updateLegislacao(id: string, updates: Record<string, any>) {
    if (!this.adminClient) return null;
    const { data: row, error } = await this.adminClient
      .from('legislacoes')
      .update(updates)
      .eq('id', id)
      .select()
      .single();
    if (error) { this.logger.error(`updateLegislacao error: ${error.message}`); return null; }
    return row;
  }

  async getLegislacaoById(id: string) {
    if (!this.adminClient) return null;
    const { data, error } = await this.adminClient
      .from('legislacoes')
      .select('*')
      .eq('id', id)
      .single();
    if (error) { this.logger.warn(`getLegislacaoById error: ${error.message}`); return null; }
    return data;
  }

  async listLegislacoes(userId?: string) {
    if (!this.adminClient) return [];
    
    try {
      if (userId) {
        // Retorna apenas as legislações assinaladas ao usuário
        const { data, error } = await this.adminClient
          .from('user_legislacao_assignments')
          .select('legislacao_id, assigned_at, legislacoes(*)')
          .eq('user_id', userId)
          .order('assigned_at', { ascending: false });
        if (error) throw error;
        
        return data.map(item => {
          const leg = Array.isArray(item.legislacoes) ? item.legislacoes[0] : item.legislacoes;
          return {
            ...(leg as any),
            assigned_at: item.assigned_at
          };
        }).filter(item => item.id); // Garante que a legislação existe
      } else {
        // Retorna todas as legislações para o catálogo global
        const { data, error } = await this.adminClient
          .from('legislacoes')
          .select('*')
          .order('created_at', { ascending: false });
        if (error) throw error;
        return data || [];
      }
    } catch (e) {
      this.logger.error(`listLegislacoes error: ${e.message}`);
      return [];
    }
  }

  async sendLegislacaoToUser(legislacaoId: string, userId: string) {
    if (!this.adminClient) return null;

    // Verifica se a legislação existe
    const leg = await this.getLegislacaoById(legislacaoId);
    if (!leg) return null;

    try {
      const { data, error } = await this.adminClient
        .from('user_legislacao_assignments')
        .upsert({
          user_id: userId,
          legislacao_id: legislacaoId,
          assigned_at: new Date().toISOString(),
        }, { onConflict: 'user_id,legislacao_id' })
        .select()
        .single();
      
      if (error) throw error;
      return data;
    } catch (error: any) {
      this.logger.error(`sendLegislacaoToUser error: ${error.message}`);
      return null;
    }
  }

  async removeLegislacaoFromUser(legislacaoId: string, userId: string) {
    if (!this.adminClient) return null;
    try {
      const { data, error } = await this.adminClient
        .from('user_legislacao_assignments')
        .delete()
        .eq('user_id', userId)
        .eq('legislacao_id', legislacaoId)
        .select();
      
      if (error) throw error;
      return data;
    } catch (error: any) {
      this.logger.error(`removeLegislacaoFromUser error: ${error.message}`);
      return null;
    }
  }

  async deleteLegislacao(id: string) {
    if (!this.adminClient) return false;
    const { error } = await this.adminClient.from('legislacoes').delete().eq('id', id);
    if (error) { this.logger.error(`deleteLegislacao error: ${error.message}`); return false; }
    return true;
  }

  async uploadLegislacaoFile(userId: string, legislacaoId: string, buffer: Buffer, fileName: string): Promise<string | null> {
    if (!this.adminClient) return null;
    const storagePath = `${userId}/${legislacaoId}/${fileName}`;
    const { error } = await this.adminClient.storage
      .from('legislacao')
      .upload(storagePath, buffer, { contentType: 'application/pdf', upsert: true });
    if (error) { this.logger.error(`uploadLegislacaoFile error: ${error.message}`); return null; }
    return storagePath;
  }

  async downloadLegislacaoFile(storagePath: string): Promise<Buffer | null> {
    if (!this.adminClient) return null;
    const { data, error } = await this.adminClient.storage
      .from('legislacao')
      .download(storagePath);
    if (error || !data) {
      this.logger.error(`downloadLegislacaoFile error: ${error?.message || 'Arquivo não encontrado'}`);
      return null;
    }
    const arrayBuffer = await data.arrayBuffer();
    return Buffer.from(arrayBuffer);
  }

  // ----------------------------------------------------------------
  // ARTIGOS
  // ----------------------------------------------------------------

  async createArtigosLote(legislacaoId: string, artigos: {
    ordem: number;
    numero: string;
    titulo?: string | null;
    texto_original: string;
    status_dispositivo?: string;
    estrutura?: any;
  }[]) {
    if (!this.adminClient || artigos.length === 0) return [];
    const rows = artigos.map(a => ({
      legislacao_id: legislacaoId,
      ordem: a.ordem,
      numero: a.numero,
      titulo: a.titulo || null,
      texto_original: a.texto_original,
      status_dispositivo: a.status_dispositivo || 'vigente_no_documento',
      estrutura: a.estrutura ? { dispositivos: a.estrutura } : { dispositivos: [] },
    }));
    const { data, error } = await this.adminClient
      .from('legislacao_artigos')
      .insert(rows)
      .select();
    if (error) { this.logger.error(`createArtigosLote error: ${error.message}`); return []; }
    return data ?? [];
  }

  async listArtigosByLegislacao(legislacaoId: string) {
    if (!this.adminClient) return [];
    const { data, error } = await this.adminClient
      .from('legislacao_artigos')
      .select('*, legislacao_comentarios(id, status, resumo, grau_confianca, erro)')
      .eq('legislacao_id', legislacaoId)
      .order('ordem', { ascending: true });
    if (error) { this.logger.error(`listArtigosByLegislacao error: ${error.message}`); return []; }
    return data ?? [];
  }

  async getArtigoById(artigoId: string) {
    if (!this.adminClient) return null;
    const { data, error } = await this.adminClient
      .from('legislacao_artigos')
      .select('*')
      .eq('id', artigoId)
      .single();
    if (error) { this.logger.warn(`getArtigoById error: ${error.message}`); return null; }
    return data;
  }

  // ----------------------------------------------------------------
  // COMENTÁRIOS
  // ----------------------------------------------------------------

  async upsertComentario(legislacaoId: string, artigoId: string, comentario: Record<string, any>, status: 'concluido' | 'erro', erro?: string) {
    if (!this.adminClient) return null;
    const payload: Record<string, any> = {
      legislacao_id: legislacaoId,
      artigo_id: artigoId,
      status,
      erro: erro || null,
      updated_at: new Date().toISOString(),
    };

    if (status === 'concluido' && comentario) {
      const jsonFields = ['direitos','obrigacoes','proibicoes','permissoes','requisitos','condicoes','competencias','prazos','excecoes','consequencias','pontos_importantes','pontos_atencao','termos_juridicos','referencias'];
      Object.assign(payload, {
        resumo: comentario.resumo || null,
        explicacao_simples: comentario.explicacao_simples || null,
        comentario_tecnico: comentario.comentario_tecnico || null,
        exemplo_pratico: comentario.exemplo_pratico || null,
        relevancia_concurso: comentario.relevancia_concurso || 'media',
        observacao_interpretativa: comentario.observacao_interpretativa || null,
        grau_confianca: comentario.grau_confianca || 'alta',
      });
      for (const f of jsonFields) {
        payload[f] = Array.isArray(comentario[f]) ? comentario[f] : [];
      }
    }

    const { data, error } = await this.adminClient
      .from('legislacao_comentarios')
      .upsert(payload, { onConflict: 'artigo_id' })
      .select()
      .single();
    if (error) { this.logger.error(`upsertComentario error: ${error.message}`); return null; }
    return data;
  }

  async getComentarioByArtigo(artigoId: string) {
    if (!this.adminClient) return null;
    const { data, error } = await this.adminClient
      .from('legislacao_comentarios')
      .select('*')
      .eq('artigo_id', artigoId)
      .single();
    if (error && error.code !== 'PGRST116') { this.logger.warn(`getComentarioByArtigo error: ${error.message}`); }
    return data || null;
  }

  // ----------------------------------------------------------------
  // PROCESSAMENTOS
  // ----------------------------------------------------------------

  async upsertProcessamento(legislacaoId: string, etapa: string, updates: {
    status?: string;
    quantidade_total?: number;
    quantidade_processada?: number;
    erro?: string | null;
  }) {
    if (!this.adminClient) return null;
    // Tenta encontrar registro existente
    const { data: existing } = await this.adminClient
      .from('legislacao_processamentos')
      .select('id')
      .eq('legislacao_id', legislacaoId)
      .eq('etapa', etapa)
      .maybeSingle();

    if (existing) {
      const { data, error } = await this.adminClient
        .from('legislacao_processamentos')
        .update({ ...updates, updated_at: new Date().toISOString() })
        .eq('id', existing.id)
        .select()
        .single();
      if (error) { this.logger.error(`upsertProcessamento update error: ${error.message}`); return null; }
      return data;
    } else {
      const { data, error } = await this.adminClient
        .from('legislacao_processamentos')
        .insert({ legislacao_id: legislacaoId, etapa, ...updates })
        .select()
        .single();
      if (error) { this.logger.error(`upsertProcessamento insert error: ${error.message}`); return null; }
      return data;
    }
  }

  async getProcessamentosByLegislacao(legislacaoId: string) {
    if (!this.adminClient) return [];
    const { data, error } = await this.adminClient
      .from('legislacao_processamentos')
      .select('*')
      .eq('legislacao_id', legislacaoId)
      .order('created_at', { ascending: true });
    if (error) { this.logger.error(`getProcessamentosByLegislacao error: ${error.message}`); return []; }
    return data ?? [];
  }

  async getProcessamentosByLegislacoes(legislacaoIds: string[]): Promise<Record<string, any[]>> {
    if (!this.adminClient || !legislacaoIds.length) return {};
    const { data, error } = await this.adminClient
      .from('legislacao_processamentos')
      .select('*')
      .in('legislacao_id', legislacaoIds)
      .order('created_at', { ascending: true });
    if (error) {
      this.logger.error(`getProcessamentosByLegislacoes error: ${error.message}`);
      return {};
    }
    const map: Record<string, any[]> = {};
    for (const row of data || []) {
      if (!map[row.legislacao_id]) map[row.legislacao_id] = [];
      map[row.legislacao_id].push(row);
    }
    return map;
  }

  async getMateriaisResumoByLegislacoes(legislacaoIds: string[]): Promise<Record<string, any>> {
    if (!this.adminClient || !legislacaoIds.length) return {};
    const { data, error } = await this.adminClient
      .from('legislacao_materiais_concurso')
      .select('legislacao_id, resumo')
      .in('legislacao_id', legislacaoIds);
    if (error) {
      this.logger.error(`getMateriaisResumoByLegislacoes error: ${error.message}`);
      return {};
    }
    const map: Record<string, any> = {};
    for (const row of data || []) {
      map[row.legislacao_id] = row.resumo;
    }
    return map;
  }

  // ----------------------------------------------------------------
  // PLANOS DE ESTUDO — Agente 3: Planejador de Cronograma
  // ----------------------------------------------------------------

  /**
   * Cria ou substitui o plano de estudo de uma legislação para um usuário.
   * Usa upsert para garantir apenas um plano ativo por legislação+usuário.
   */
  async upsertPlanoLegislacao(
    legislacaoId: string,
    userId: string,
    updates: Record<string, any>,
  ) {
    if (!this.adminClient) return null;
    const { data, error } = await this.adminClient
      .from('legislacao_planos')
      .upsert(
        {
          legislacao_id: legislacaoId,
          user_id: userId,
          ...updates,
          updated_at: new Date().toISOString(),
        },
        { onConflict: 'legislacao_id,user_id' },
      )
      .select()
      .single();
    if (error) { this.logger.error(`upsertPlanoLegislacao error: ${error.message}`); return null; }
    return data;
  }

  /**
   * Busca o plano de estudo de uma legislação para um usuário.
   */
  async getPlanoByLegislacao(legislacaoId: string, userId: string) {
    if (!this.adminClient) return null;
    const { data, error } = await this.adminClient
      .from('legislacao_planos')
      .select('*')
      .eq('legislacao_id', legislacaoId)
      .eq('user_id', userId)
      .maybeSingle();
    if (error) { this.logger.warn(`getPlanoByLegislacao error: ${error.message}`); return null; }
    return data || null;
  }

  /**
   * Lista artigos de uma legislação com seus comentários completos.
   * Usado pelo Agente 3 para montar o contexto de análise.
   */
  async listArtigosComComentarios(legislacaoId: string) {
    if (!this.adminClient) return [];
    const { data, error } = await this.adminClient
      .from('legislacao_artigos')
      .select(`
        id,
        ordem,
        numero,
        titulo,
        texto_original,
        status_dispositivo,
        estrutura,
        legislacao_comentarios (
          resumo,
          explicacao_simples,
          comentario_tecnico,
          direitos,
          obrigacoes,
          proibicoes,
          permissoes,
          requisitos,
          condicoes,
          competencias,
          prazos,
          excecoes,
          consequencias,
          pontos_importantes,
          pontos_atencao,
          termos_juridicos,
          referencias,
          exemplo_pratico,
          relevancia_concurso,
          observacao_interpretativa,
          grau_confianca,
          status
        )
      `)
      .eq('legislacao_id', legislacaoId)
      .order('ordem', { ascending: true });
    if (error) { this.logger.error(`listArtigosComComentarios error: ${error.message}`); return []; }
    return data ?? [];
  }

  /**
   * Busca lista de números dos artigos marcados como lidos pelo usuário para esta legislação.
   */
  async getArtigosLidos(legislacaoId: string, userId: string): Promise<string[]> {
    if (!this.adminClient || !userId) return [];
    const { data, error } = await this.adminClient
      .from('legislacao_artigos_lidos')
      .select('artigo_numero')
      .eq('legislacao_id', legislacaoId)
      .eq('user_id', userId);
    if (error) {
      this.logger.warn(`getArtigosLidos error: ${error.message}`);
      return [];
    }
    return (data || []).map((row: any) => String(row.artigo_numero));
  }

  /**
   * Busca artigos lidos de todas as legislações para um determinado usuário, mapeados por legislacao_id.
   */
  async getAllArtigosLidosByUser(userId: string): Promise<Record<string, string[]>> {
    if (!this.adminClient || !userId) return {};
    const { data, error } = await this.adminClient
      .from('legislacao_artigos_lidos')
      .select('legislacao_id, artigo_numero')
      .eq('user_id', userId);
    if (error) {
      this.logger.warn(`getAllArtigosLidosByUser error: ${error.message}`);
      return {};
    }
    const map: Record<string, string[]> = {};
    for (const row of data || []) {
      if (!map[row.legislacao_id]) map[row.legislacao_id] = [];
      map[row.legislacao_id].push(String(row.artigo_numero));
    }
    return map;
  }

  /**
   * Marca ou desmarca um artigo como lido pelo usuário.
   * Também sincroniza a coluna artigos_lidos em legislacao_planos.
   */
  async toggleArtigoLido(
    legislacaoId: string,
    artigoId: string,
    artigoNumero: string,
    userId: string,
    lido?: boolean,
  ): Promise<{ lido: boolean; artigos_lidos: string[] }> {
    if (!this.adminClient || !userId) return { lido: false, artigos_lidos: [] };

    const { data: existing } = await this.adminClient
      .from('legislacao_artigos_lidos')
      .select('id')
      .eq('legislacao_id', legislacaoId)
      .eq('artigo_id', artigoId)
      .eq('user_id', userId)
      .maybeSingle();

    const shouldBeLido = lido !== undefined ? lido : !existing;

    if (shouldBeLido) {
      if (!existing) {
        await this.adminClient
          .from('legislacao_artigos_lidos')
          .insert({
            legislacao_id: legislacaoId,
            artigo_id: artigoId,
            artigo_numero: String(artigoNumero),
            user_id: userId,
          });
      }
    } else {
      if (existing) {
        await this.adminClient
          .from('legislacao_artigos_lidos')
          .delete()
          .eq('legislacao_id', legislacaoId)
          .eq('artigo_id', artigoId)
          .eq('user_id', userId);
      }
    }

    const artigosLidos = await this.getArtigosLidos(legislacaoId, userId);

    try {
      await this.adminClient
        .from('legislacao_planos')
        .update({ artigos_lidos: artigosLidos, updated_at: new Date().toISOString() })
        .eq('legislacao_id', legislacaoId)
        .eq('user_id', userId);
    } catch (e: any) {
      this.logger.warn(`Falha ao sincronizar artigos_lidos no plano: ${e.message}`);
    }

    return { lido: shouldBeLido, artigos_lidos: artigosLidos };
  }

  // ----------------------------------------------------------------
  // ANÁLISE ESTRATÉGICA — Agente 3: Analista Estratégico de Concursos
  // ----------------------------------------------------------------

  /**
   * Salva ou atualiza a análise estratégica do Agente 3 para uma legislação e usuário.
   */
  async upsertAnaliseEstrategica(
    legislacaoId: string,
    userId: string,
    updates: Record<string, any>,
  ) {
    if (!this.adminClient) return null;

    const { data: existente } = await this.adminClient
      .from('legislacao_analises_estrategicas')
      .select('id')
      .eq('legislacao_id', legislacaoId)
      .limit(1)
      .maybeSingle();

    if (existente?.id) {
      const { data, error } = await this.adminClient
        .from('legislacao_analises_estrategicas')
        .update({
          ...updates,
          updated_at: new Date().toISOString(),
        })
        .eq('id', existente.id)
        .select()
        .single();
        
      if (error) {
        this.logger.error(`upsertAnaliseEstrategica update error: ${error.message}`);
        return null;
      }
      return data;
    } else {
      const { data, error } = await this.adminClient
        .from('legislacao_analises_estrategicas')
        .insert({
          legislacao_id: legislacaoId,
          user_id: userId,
          ...updates,
          updated_at: new Date().toISOString(),
        })
        .select()
        .single();

      if (error) {
        this.logger.error(`upsertAnaliseEstrategica insert error: ${error.message}`);
        return null;
      }
      return data;
    }
  }

  /**
   * Obtém a análise estratégica gerada pelo Agente 3 para uma legislação e usuário.
   */
  async getAnaliseEstrategicaByLegislacao(legislacaoId: string, userId: string) {
    if (!this.adminClient) return null;
    const { data, error } = await this.adminClient
      .from('legislacao_analises_estrategicas')
      .select('*')
      .eq('legislacao_id', legislacaoId)
      .limit(1)
      .maybeSingle();
    if (error) {
      this.logger.warn(`getAnaliseEstrategicaByLegislacao error: ${error.message}`);
      return null;
    }
    return data || null;
  }

  // ----------------------------------------------------------------
  // MATERIAL DE FIXAÇÃO — Agente 5: Gerador de Questões e Material de Fixação
  // ----------------------------------------------------------------

  /**
   * Salva ou atualiza o material de concurso consolidado da legislação para um usuário.
   */
  async upsertMaterialConcurso(
    legislacaoId: string,
    userId: string,
    updates: Record<string, any>,
  ) {
    if (!this.adminClient) return null;

    const { data: existente } = await this.adminClient
      .from('legislacao_materiais_concurso')
      .select('id')
      .eq('legislacao_id', legislacaoId)
      .limit(1)
      .maybeSingle();

    if (existente?.id) {
      const { data, error } = await this.adminClient
        .from('legislacao_materiais_concurso')
        .update({
          ...updates,
          updated_at: new Date().toISOString(),
        })
        .eq('id', existente.id)
        .select()
        .single();

      if (error) {
        this.logger.error(`updateMaterialConcurso error: ${error.message}`);
        return null;
      }
      return data;
    } else {
      const { data, error } = await this.adminClient
        .from('legislacao_materiais_concurso')
        .insert({
          legislacao_id: legislacaoId,
          user_id: userId,
          ...updates,
          updated_at: new Date().toISOString(),
        })
        .select()
        .single();

      if (error) {
        this.logger.error(`insertMaterialConcurso error: ${error.message}`);
        return null;
      }
      return data;
    }
  }

  /**
   * Obtém o material de concurso gerado pelo Agente 4 para uma legislação e usuário.
   */
  async getMaterialConcursoByLegislacao(legislacaoId: string, userId: string) {
    if (!this.adminClient) return null;
    const { data, error } = await this.adminClient
      .from('legislacao_materiais_concurso')
      .select('*')
      .eq('legislacao_id', legislacaoId)
      .limit(1)
      .maybeSingle();
    if (error) {
      this.logger.warn(`getMaterialConcursoByLegislacao error: ${error.message}`);
      return null;
    }
    return data || null;
  }
}



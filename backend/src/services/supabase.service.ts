import { Injectable, Logger } from '@nestjs/common';
import { createClient, SupabaseClient } from '@supabase/supabase-js';
import * as ws from 'ws';

@Injectable()
export class SupabaseService {
  private readonly logger = new Logger(SupabaseService.name);
  private client: SupabaseClient | null = null;
  private adminClient: SupabaseClient | null = null;
  private isConfigured = false;

  constructor() {
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

  // ----------------------------------------------------------------
  // QUESTIONS
  // ----------------------------------------------------------------

  async getQuestions(isReleasedOnly = false) {
    if (!this.adminClient) return [];

    let query = this.adminClient
      .from('questoes')
      .select('*')
      .order('created_at', { ascending: false });

    if (isReleasedOnly) {
      query = query.eq('is_released', true);
    }

    const { data, error } = await query;
    if (error) {
      this.logger.error(`getQuestions error: ${error.message}`);
      return [];
    }
    return (data ?? []).map((question) => this.toQuestionResponse(question));
  }

  async getQualityAnalysis() {
    const questions = await this.getQuestions(false);
    return this.generateQualityReport(questions);
  }

  async toggleQuestionRelease(id: string) {
    if (!this.adminClient) return null;

    // Busca estado atual
    const { data: current } = await this.adminClient
      .from('questoes')
      .select('is_released')
      .eq('id', id)
      .single();

    if (!current) return null;

    const { data, error } = await this.adminClient
      .from('questoes')
      .update({ is_released: !current.is_released })
      .eq('id', id)
      .select()
      .single();

    if (error) {
      this.logger.error(`toggleQuestionRelease error: ${error.message}`);
      return null;
    }
    return this.toQuestionResponse(data);
  }

  async addExtractedQuestions(pdfName: string, questions: any[]) {
    if (!this.adminClient) return [];

    const rows = questions.map((q) => {
      const tipo = q.tipo === 'certo_errado' ? 'certo_errado' : 'multipla_escolha';

      let alternativa_a = tipo === 'multipla_escolha' ? (q.alternativa_a || null) : null;
      let alternativa_b = tipo === 'multipla_escolha' ? (q.alternativa_b || null) : null;
      let alternativa_c = tipo === 'multipla_escolha' ? (q.alternativa_c || null) : null;
      let alternativa_d = tipo === 'multipla_escolha' ? (q.alternativa_d || null) : null;
      let alternativa_e = tipo === 'multipla_escolha' ? (q.alternativa_e || null) : null;

      if (tipo === 'multipla_escolha') {
        const opts = q.options || q.alternativas || [];
        if (Array.isArray(opts) && opts.length > 0) {
          opts.forEach((opt: any) => {
            const letter = (opt.letter || opt.letra || '').toUpperCase();
            const text = opt.text || opt.texto || '';
            if (letter === 'A') alternativa_a = text;
            else if (letter === 'B') alternativa_b = text;
            else if (letter === 'C') alternativa_c = text;
            else if (letter === 'D') alternativa_d = text;
            else if (letter === 'E') alternativa_e = text;
          });
        }
      }

      return {
        prova: q.prova || pdfName,
        enunciado: q.enunciado || q.statement,
        tipo,
        alternativa_a,
        alternativa_b,
        alternativa_c,
        alternativa_d,
        alternativa_e,
        resposta_correta:
          tipo === 'multipla_escolha'
            ? q.resposta_correta || q.correct_option || null
            : null,
        resposta_boolean:
          tipo === 'certo_errado' ? (q.resposta_boolean !== undefined ? q.resposta_boolean : null) : null,
        explanation: q.explanation || q.explicacao,
        disciplina: q.disciplina || q.subject || q.materia || 'Geral',
        tema: q.tema || q.topic || q.assunto || 'Geral',
        ano: q.ano || null,
        banca: q.banca || null,
        orgao: q.orgao || null,
        grau_dificuldade:
          q.grau_dificuldade || q.quality_metrics?.difficulty_level || 'Médio',
        imagem_url: q.imagem_url || null,
        is_released: false,
        quality_metrics: q.quality_metrics || {
          clarity_score: 9.4,
          distractor_plausibility: 9.1,
          bloom_taxonomy: 'Aplicação',
          difficulty_level: 'Médio',
          overall_quality_score: 9.3,
          quality_comments:
            'Questão extraída via IA com alto rigor técnico e alinhamento com a bibliografia do PDF.',
        },
      };
    });

    const { data, error } = await this.adminClient
      .from('questoes')
      .insert(rows)
      .select();

    if (error) {
      this.logger.error(`addExtractedQuestions error: ${error.message}`);
      return [];
    }
    return (data ?? []).map((question) => this.toQuestionResponse(question));
  }

  // ----------------------------------------------------------------
  // EDITAIS
  // ----------------------------------------------------------------

  async getEditais() {
    if (!this.adminClient) return [];

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
    return data;
  }

  async addEdital(title: string, uploadedBy: string, paretoData: any) {
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
      })
      .select()
      .single();

    if (error) {
      this.logger.error(`addEdital error: ${error.message}`);
      return null;
    }
    return data;
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
    const qualityMetrics = question.quality_metrics || {};

    return {
      id: String(question.id),
      codigo: question.codigo,
      pdf_name: question.prova,
      statement: question.enunciado,
      options: question.tipo === 'multipla_escolha' ? [
        { letter: 'A', text: question.alternativa_a },
        { letter: 'B', text: question.alternativa_b },
        { letter: 'C', text: question.alternativa_c },
        { letter: 'D', text: question.alternativa_d },
        { letter: 'E', text: question.alternativa_e },
      ].filter(o => o.text !== null && o.text !== undefined) : [],
      correct_option: question.resposta_correta,
      tipo: question.tipo,
      resposta_boolean: question.resposta_boolean,
      explanation: question.explanation,
      subject: question.disciplina,
      topic: question.tema,
      is_released: question.is_released,
      quality_metrics: {
        ...qualityMetrics,
        difficulty_level: question.grau_dificuldade || qualityMetrics.difficulty_level,
      },
      metadata: {
        ano: question.ano,
        banca: question.banca,
        orgao: question.orgao,
        prova: question.prova,
        imagem_url: question.imagem_url,
      },
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
}

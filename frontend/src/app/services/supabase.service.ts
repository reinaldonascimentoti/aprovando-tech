import { Injectable, OnDestroy } from '@angular/core';
import { createClient, SupabaseClient, Session, User, AuthChangeEvent } from '@supabase/supabase-js';
import { BehaviorSubject, Observable } from 'rxjs';
import { environment } from '../../environments/environment';

@Injectable({
  providedIn: 'root'
})
export class SupabaseService implements OnDestroy {
  private supabase: SupabaseClient;
  private sessionSubject = new BehaviorSubject<Session | null>(null);

  public session$: Observable<Session | null> = this.sessionSubject.asObservable();

  constructor() {
    this.supabase = createClient(
      environment.supabaseUrl,
      environment.supabaseAnonKey,
      {
        auth: {
          autoRefreshToken: true,
          persistSession: true,
          detectSessionInUrl: true,
        }
      }
    );

    // Restaura sessão existente ao inicializar
    this.supabase.auth.getSession().then(({ data }) => {
      this.sessionSubject.next(data.session);
    });

    // Escuta mudanças de autenticação
    this.supabase.auth.onAuthStateChange((event: AuthChangeEvent, session: Session | null) => {
      this.sessionSubject.next(session);
    });
  }

  get client(): SupabaseClient {
    return this.supabase;
  }

  get currentSession(): Session | null {
    return this.sessionSubject.value;
  }

  get currentUser(): User | null {
    return this.sessionSubject.value?.user ?? null;
  }

  /** Token JWT atual para enviar no header Authorization */
  get accessToken(): string | null {
    return this.sessionSubject.value?.access_token ?? null;
  }

  async signIn(email: string, password: string) {
    const { data, error } = await this.supabase.auth.signInWithPassword({ email, password });
    if (error) throw error;
    return data;
  }

  async signUp(email: string, password: string, fullName: string) {
    const { data, error } = await this.supabase.auth.signUp({
      email,
      password,
      options: {
        data: { full_name: fullName },
        emailRedirectTo: `${window.location.origin}/auth/callback`,
      }
    });
    if (error) throw error;
    return data;
  }

  async signOut() {
    await this.supabase.auth.signOut();
    this.sessionSubject.next(null);
  }

  async refreshSession() {
    const { data, error } = await this.supabase.auth.refreshSession();
    if (!error && data.session) {
      this.sessionSubject.next(data.session);
    }
  }

  // ----------------------------------------------------------------
  // USER TOPIC PROGRESS (Checklist Sync)
  // ----------------------------------------------------------------

  /** Carrega todo o progresso do checklist de um edital para o usuário atual */
  async getUserEditalChecklist(editalId: string): Promise<Record<string, boolean>> {
    const user = this.currentUser;
    if (!user || !editalId) return {};
    try {
      const { data, error } = await this.supabase
        .from('user_topic_progress')
        .select('topic_id, completed')
        .eq('user_id', user.id)
        .eq('edital_id', editalId);

      if (error) {
        console.error('Erro ao carregar checklist do Supabase:', error);
        return {};
      }

      const map: Record<string, boolean> = {};
      (data || []).forEach(row => {
        map[row.topic_id] = !!row.completed;
      });
      return map;
    } catch (e) {
      console.error('Exceção ao buscar checklist do Supabase:', e);
      return {};
    }
  }

  /** Salva/Atualiza o estado de um tópico/subtópico do checklist */
  async saveUserTopicProgress(editalId: string, topicId: string, completed: boolean): Promise<void> {
    const user = this.currentUser;
    if (!user || !editalId || !topicId) return;
    try {
      await this.supabase
        .from('user_topic_progress')
        .upsert(
          {
            user_id: user.id,
            edital_id: editalId,
            topic_id: topicId,
            completed: completed,
            updated_at: new Date().toISOString()
          },
          { onConflict: 'user_id,edital_id,topic_id' }
        );
    } catch (e) {
      console.error('Erro ao salvar progresso do checklist no Supabase:', e);
    }
  }

  /** Salva múltiplos tópicos/subtópicos de uma só vez no Supabase */
  async saveUserTopicProgressBatch(editalId: string, items: { topicId: string; completed: boolean }[]): Promise<void> {
    const user = this.currentUser;
    if (!user || !editalId || items.length === 0) return;
    try {
      const records = items.map(item => ({
        user_id: user.id,
        edital_id: editalId,
        topic_id: item.topicId,
        completed: item.completed,
        updated_at: new Date().toISOString()
      }));

      await this.supabase
        .from('user_topic_progress')
        .upsert(records, { onConflict: 'user_id,edital_id,topic_id' });
    } catch (e) {
      console.error('Erro ao salvar lote de progresso no Supabase:', e);
    }
  }

  /** Reseta todo o progresso de checklist de um edital no Supabase */
  async resetUserEditalProgress(editalId: string): Promise<void> {
    const user = this.currentUser;
    if (!user || !editalId) return;
    try {
      await this.supabase
        .from('user_topic_progress')
        .delete()
        .eq('user_id', user.id)
        .eq('edital_id', editalId);
    } catch (e) {
      console.error('Erro ao resetar progresso no Supabase:', e);
    }
  }

  /** Busca contagem pública de editais, questões e candidatos */
  async getPublicStats(): Promise<{ editaisCount: number; questoesCount: number; candidatosCount: number }> {
    try {
      // 1. Tenta obter via RPC get_platform_stats (seguro e com permissão pública)
      const { data: rpcData, error: rpcError } = await this.supabase.rpc('get_platform_stats');
      if (!rpcError && rpcData) {
        return {
          editaisCount: Number(rpcData.editaisCount) || 0,
          questoesCount: Number(rpcData.questoesCount) || 0,
          candidatosCount: Number(rpcData.candidatosCount) || 0,
        };
      }

      // 2. Fallback direto nas tabelas públicas caso RPC ainda não tenha sido criada
      const [editaisRes, questoesRes, profilesRes] = await Promise.all([
        this.supabase.from('editais').select('id', { count: 'exact', head: true }),
        this.supabase.from('questoes').select('id', { count: 'exact', head: true }),
        this.supabase.from('profiles').select('id', { count: 'exact', head: true }),
      ]);

      return {
        editaisCount: editaisRes.count ?? 0,
        questoesCount: questoesRes.count ?? 0,
        candidatosCount: profilesRes.count ?? 0,
      };
    } catch (err) {
      console.error('Erro ao buscar estatísticas do Supabase:', err);
      return { editaisCount: 0, questoesCount: 0, candidatosCount: 0 };
    }
  }

  /** Verifica se o e-mail do usuário atual está confirmado */
  isEmailConfirmed(): boolean {
    const user = this.currentUser;
    return !!user?.email_confirmed_at;
  }

  /** Reenvia o e-mail de confirmação de cadastro */
  async resendConfirmationEmail(email: string): Promise<void> {
    const { error } = await this.supabase.auth.resend({
      type: 'signup',
      email,
    });
    if (error) throw error;
  }

  /** Envia e-mail de redefinição de senha */
  async sendPasswordReset(email: string): Promise<void> {
    const redirectTo = `${window.location.origin}/login`;
    const { error } = await this.supabase.auth.resetPasswordForEmail(email, {
      redirectTo,
    });
    if (error) throw error;
  }


  // ----------------------------------------------------------------
  // USER QUESTION ANSWERS (Acerto por Disciplina)
  // ----------------------------------------------------------------

  /**
   * Salva ou atualiza (upsert) a resposta de uma questão.
   * A resposta mais recente substitui a anterior para a mesma questão.
   */
  async saveQuestionAnswer(payload: {
    questionId: string;
    disciplina: string;
    banca?: string;
    ano?: number;
    isCorrect: boolean;
  }): Promise<void> {
    const user = this.currentUser;
    if (!user) {
      console.warn('saveQuestionAnswer: Usuário não autenticado no Supabase. Resposta não persistida.');
      return;
    }
    try {
      const { error } = await this.supabase
        .from('user_question_answers')
        .upsert(
          {
            user_id: user.id,
            question_id: payload.questionId,
            disciplina: (payload.disciplina || 'Geral').toUpperCase().trim(),
            banca: payload.banca || null,
            ano: payload.ano || null,
            is_correct: payload.isCorrect,
            answered_at: new Date().toISOString(),
          },
          { onConflict: 'user_id,question_id' }
        );
      if (error) {
        console.error('Erro ao salvar resposta no Supabase:', error);
      }
    } catch (e) {
      console.error('Exceção ao salvar resposta no Supabase:', e);
    }
  }

  /**
   * Busca o % de acerto por disciplina do usuário atual via RPC (com fallback para consulta direta).
   * Retorna array ordenado por % decrescente.
   */
  async getAccuracyByDisciplina(): Promise<{
    disciplina: string;
    total: number;
    corretas: number;
    pct: number;
  }[]> {
    const user = this.currentUser;
    if (!user) return [];
    try {
      const { data, error } = await this.supabase.rpc('get_accuracy_by_disciplina');
      if (!error && data && data.length > 0) {
        return data.map((row: any) => ({
          disciplina: row.disciplina,
          total: Number(row.total),
          corretas: Number(row.corretas),
          pct: Number(row.pct),
        }));
      }
      // Fallback: consulta direta à tabela user_question_answers caso RPC não retorne
      return await this.getAccuracyByDisciplinaFallback(user.id);
    } catch (e) {
      console.error('Exceção ao buscar acerto por disciplina:', e);
      return await this.getAccuracyByDisciplinaFallback(user.id);
    }
  }

  private async getAccuracyByDisciplinaFallback(userId: string): Promise<{
    disciplina: string;
    total: number;
    corretas: number;
    pct: number;
  }[]> {
    try {
      const { data, error } = await this.supabase
        .from('user_question_answers')
        .select('disciplina, is_correct')
        .eq('user_id', userId);

      if (error || !data || data.length === 0) return [];

      const map = new Map<string, { total: number; corretas: number }>();
      for (const row of data) {
        const d = (row.disciplina || 'GERAL').toUpperCase().trim();
        const cur = map.get(d) || { total: 0, corretas: 0 };
        cur.total++;
        if (row.is_correct) cur.corretas++;
        map.set(d, cur);
      }

      return Array.from(map.entries()).map(([disciplina, s]) => ({
        disciplina,
        total: s.total,
        corretas: s.corretas,
        pct: Math.round((s.corretas / s.total) * 100 * 10) / 10,
      })).sort((a, b) => b.pct - a.pct || b.total - a.total);
    } catch {
      return [];
    }
  }

  /**
   * Busca todas as respostas do usuário atual como um mapa { question_id → { isCorrect } }.
   * Usado para pré-popular marcações de questões resolvidas/erradas entre sessões.
   */
  async getUserAnswerMap(): Promise<Record<string, { isCorrect: boolean }>> {
    const user = this.currentUser;
    if (!user) return {};
    try {
      const { data, error } = await this.supabase
        .from('user_question_answers')
        .select('question_id, is_correct')
        .eq('user_id', user.id);

      if (error || !data) return {};

      const map: Record<string, { isCorrect: boolean }> = {};
      for (const row of data) {
        map[String(row.question_id)] = { isCorrect: !!row.is_correct };
      }
      return map;
    } catch (e) {
      console.error('Erro ao buscar mapa de respostas do usuário:', e);
      return {};
    }
  }

  // ----------------------------------------------------------------
  // STUDY SESSIONS — Banco de Horas Pomodoro
  // ----------------------------------------------------------------

  /** Salva uma sessão de estudo (pomodoro concluído ou adição manual) */
  async saveStudySession(session: {
    editalId?: string | null;
    disciplina?: string | null;
    duracaoMin: number;
    tipo: 'pomodoro' | 'manual';
    notas?: string | null;
    startedAt?: string;
  }): Promise<void> {
    const user = this.currentUser;
    if (!user) return;
    try {
      const { error } = await this.supabase.from('study_sessions').insert({
        user_id: user.id,
        edital_id: session.editalId || null,
        disciplina: session.disciplina || null,
        duracao_min: session.duracaoMin,
        tipo: session.tipo,
        notas: session.notas || null,
        started_at: session.startedAt || new Date().toISOString(),
      });
      if (error) console.error('Erro ao salvar sessão de estudo:', error);
    } catch (e) {
      console.error('Exceção ao salvar sessão de estudo:', e);
    }
  }

  /** Busca sessões de estudo do usuário com filtros opcionais */
  async getStudySessions(opts?: {
    editalId?: string;
    desde?: Date;
    limite?: number;
  }): Promise<{
    id: string;
    edital_id: string | null;
    disciplina: string | null;
    duracao_min: number;
    tipo: string;
    notas: string | null;
    started_at: string;
  }[]> {
    const user = this.currentUser;
    if (!user) return [];
    try {
      let query = this.supabase
        .from('study_sessions')
        .select('id, edital_id, disciplina, duracao_min, tipo, notas, started_at')
        .eq('user_id', user.id)
        .order('started_at', { ascending: false });

      if (opts?.editalId) query = query.eq('edital_id', opts.editalId);
      if (opts?.desde) query = query.gte('started_at', opts.desde.toISOString());
      if (opts?.limite) query = query.limit(opts.limite);

      const { data, error } = await query;
      if (error) { console.error('Erro ao buscar sessões:', error); return []; }
      return data || [];
    } catch (e) {
      console.error('Exceção ao buscar sessões:', e);
      return [];
    }
  }

  /** Horas de estudo por dia nos últimos 7 dias via RPC */
  async getWeeklyStudyHours(): Promise<{ day_date: string; total_min: number }[]> {
    const user = this.currentUser;
    if (!user) return [];
    try {
      const { data, error } = await this.supabase.rpc('get_weekly_study_hours');
      if (error) { console.error('Erro ao buscar horas semanais:', error); return []; }
      return (data || []).map((r: any) => ({ day_date: r.day_date, total_min: Number(r.total_min) }));
    } catch (e) {
      console.error('Exceção ao buscar horas semanais:', e);
      return [];
    }
  }

  /** Horas de estudo agrupadas por edital via RPC */
  async getStudyHoursByEdital(): Promise<{ edital_id: string; total_min: number }[]> {
    const user = this.currentUser;
    if (!user) return [];
    try {
      const { data, error } = await this.supabase.rpc('get_study_hours_by_edital');
      if (error) { console.error('Erro ao buscar horas por edital:', error); return []; }
      return (data || []).map((r: any) => ({ edital_id: r.edital_id, total_min: Number(r.total_min) }));
    } catch (e) {
      console.error('Exceção ao buscar horas por edital:', e);
      return [];
    }
  }

  /** Deleta uma sessão de estudo pelo id */
  async deleteStudySession(sessionId: string): Promise<void> {
    const user = this.currentUser;
    if (!user) return;
    try {
      const { error } = await this.supabase
        .from('study_sessions')
        .delete()
        .eq('id', sessionId)
        .eq('user_id', user.id);
      if (error) console.error('Erro ao deletar sessão:', error);
    } catch (e) {
      console.error('Exceção ao deletar sessão:', e);
    }
  }

  ngOnDestroy() {
    this.supabase.auth.onAuthStateChange(() => {});
  }
}

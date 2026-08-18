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
      options: { data: { full_name: fullName } }
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

  ngOnDestroy() {
    this.supabase.auth.onAuthStateChange(() => {});
  }
}


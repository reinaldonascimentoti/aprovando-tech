import { Injectable } from '@angular/core';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { Observable, from } from 'rxjs';
import { SupabaseService } from './supabase.service';
import { environment } from '../../environments/environment';

export interface Legislacao {
  id: string;
  user_id: string;
  tipo: string | null;
  numero: string | null;
  ano: number | null;
  titulo: string;
  ementa: string | null;
  data_publicacao: string | null;
  data_vigencia: string | null;
  orgao_emissor: string | null;
  fonte: string | null;
  arquivo_path: string | null;
  arquivo_nome: string | null;
  status: 'pendente' | 'extraindo' | 'extraida' | 'comentando' | 'concluida' | 'erro';
  created_at: string;
  updated_at: string;
  processamentos?: LegislacaoProcessamento[];
  artigos_lidos?: string[];
}

export interface LegislacaoArtigo {
  id: string;
  legislacao_id: string;
  ordem: number;
  numero: string;
  titulo: string | null;
  texto_original: string;
  status_dispositivo: string;
  estrutura: { dispositivos: DispositivoExtraido[] };
  legislacao_comentarios?: any;
}

export interface DispositivoExtraido {
  ordem: number;
  tipo: string;
  numero: string | null;
  texto_original: string;
}

export interface LegislacaoComentario {
  id: string;
  legislacao_id: string;
  artigo_id: string;
  resumo: string | null;
  explicacao_simples: string | null;
  comentario_tecnico: string | null;
  direitos: any[];
  obrigacoes: any[];
  proibicoes: any[];
  permissoes: any[];
  requisitos: any[];
  condicoes: any[];
  competencias: any[];
  prazos: any[];
  excecoes: any[];
  consequencias: any[];
  pontos_importantes: any[];
  pontos_atencao: any[];
  referencias: any[];
  exemplo_pratico: string | null;
  relevancia_concurso: 'alta' | 'media' | 'baixa';
  observacao_interpretativa: string | null;
  grau_confianca: 'alta' | 'media' | 'baixa';
  status: 'pendente' | 'processando' | 'concluido' | 'erro';
  erro: string | null;
}

export interface LegislacaoProcessamento {
  id: string;
  legislacao_id: string;
  etapa: 'extracao' | 'comentarios' | 'finalizacao';
  status: 'pendente' | 'processando' | 'concluido' | 'erro';
  quantidade_total: number;
  quantidade_processada: number;
  erro: string | null;
}

// ---------------------------------------------------------------
// Agente 3 — Analista Estratégico de Concursos
// ---------------------------------------------------------------

export interface MetaQuestoesArtigo {
  minimo: number;
  recomendado: number;
  maximo: number;
}

export interface MetaFlashcardsArtigo {
  minimo: number;
  recomendado: number;
  maximo: number;
}

export interface AnaliseArtigoConcurso {
  artigo_id: string;
  artigo_numero?: string;
  prioridade: 'alta' | 'media' | 'baixa' | 'fora_de_escopo';
  potencial_cobranca: 'alto' | 'medio' | 'baixo';
  justificativa: string;
  riscos_de_erro: string[];
  formas_de_cobranca: string[];
  meta_questoes: MetaQuestoesArtigo;
  meta_flashcards: MetaFlashcardsArtigo;
  tipos_recomendados: string[];
}

export interface ComparacaoRecomendada {
  artigos: string[];
  motivo: string;
  foco: string;
  tipo_questao?: string;
}

export interface LegislacaoAnaliseEstrategica {
  id: string;
  legislacao_id: string;
  user_id: string;
  meta_global: {
    meta_questoes_total: number;
    meta_flashcards_total: number;
  };
  analise_concurso: AnaliseArtigoConcurso[];
  comparacoes_recomendadas: ComparacaoRecomendada[];
  status: 'pendente' | 'processando' | 'concluido' | 'erro';
  erro: string | null;
  created_at: string;
  updated_at: string;
}

// ---------------------------------------------------------------
// Agente 4 — Planejador e Gerenciador de Cronograma de Estudos
// ---------------------------------------------------------------

export interface PreferenciasEstudante {
  data_inicio?: string;
  data_prova?: string;
  tempo_diario_minutos?: number;
  dias_disponiveis?: number[];
  nivel_estudante?: 'iniciante' | 'intermediario' | 'avancado';
  objetivo?: string;
  prioridade_legislacao?: 'alta' | 'media' | 'baixa';
}

export interface BlocoEstudo {
  id: string;
  ordem: number;
  titulo: string;
  assunto: string;
  artigos: string[];
  artigo_inicial: string;
  artigo_final: string;
  quantidade_artigos: number;
  prioridade: 'alta' | 'media' | 'baixa';
  complexidade: 'alta' | 'media' | 'baixa';
  tempo_estimado_minutos: number;
  justificativa: string;
}

export interface SessaoEstudo {
  id: string;
  ordem: number;
  data: string;
  bloco_id: string;
  tipo: 'leitura_inicial' | 'estudo_detalhado' | 'revisao_24h' | 'revisao_7_dias' | 'revisao_30_dias' | 'revisao_final' | 'consolidacao';
  objetivo: string;
  artigos: string[];
  tempo_minutos: number;
  prioridade: 'alta' | 'media' | 'baixa';
  meta_questoes?: number;
}

export interface RevisaoEstudo {
  sessao_origem_id: string;
  tipo: 'revisao_24h' | 'revisao_7_dias' | 'revisao_30_dias' | 'revisao_final';
  data: string;
  artigos: string[];
  tempo_minutos: number;
}

export interface LegislacaoPlano {
  id: string;
  legislacao_id: string;
  user_id: string;
  plano_estudo: {
    legislacao_id: string;
    objetivo: string;
    data_inicio: string;
    data_prova: string | null;
    tempo_diario_minutos: number;
    dias_disponiveis: number[];
    nivel_estudante: string;
    estrategia: string;
    premissas: string[];
  } | null;
  priorizacao: any[];
  blocos: BlocoEstudo[];
  sessoes: SessaoEstudo[];
  revisoes: RevisaoEstudo[];
  resumo: {
    total_artigos: number;
    artigos_planejados: number;
    artigos_prioridade_alta: number;
    artigos_prioridade_media: number;
    artigos_prioridade_baixa: number;
    total_blocos: number;
    total_sessoes: number;
    tempo_total_minutos: number;
  } | null;
  alertas: string[];
  preferencias: PreferenciasEstudante;
  status: 'pendente' | 'processando' | 'concluido' | 'erro';
  erro: string | null;
  artigos_lidos?: string[];
  created_at: string;
  updated_at: string;
}

// ---------------------------------------------------------------
// Agente 5 — Gerador de Questões e Material de Fixação
// ---------------------------------------------------------------

export interface PontoDeProva {
  id: string;
  artigo_id?: string;
  artigo_numero: string;
  assunto: string;
  conteudo: string;
  motivo_relevancia: string;
  prioridade: 'alta' | 'media' | 'baixa';
  dificuldade: 'facil' | 'medio' | 'dificil';
}

export interface Pegadinha {
  id: string;
  artigo_id?: string;
  artigo_numero: string;
  descricao: string;
  forma_de_cobranca: string;
  resposta_correta: string;
  prioridade: 'alta' | 'media' | 'baixa';
}

export interface ConceitoMemorizacao {
  id: string;
  artigo_id?: string;
  artigo_numero: string;
  conceito: string;
  o_que_memorizar: string;
  estrategia_memorizacao: string;
  prioridade: 'alta' | 'media' | 'baixa';
}

export interface Comparacao {
  id: string;
  titulo: string;
  artigos: string[];
  semelhancas: string[];
  diferencas: string[];
  ponto_atencao: string;
}

export interface FlashcardConcurso {
  id: string;
  artigo_id?: string;
  artigo_numero: string;
  pergunta: string;
  resposta: string;
  assunto: string;
  dificuldade: 'facil' | 'medio' | 'dificil';
  prioridade: 'alta' | 'media' | 'baixa';
}

export interface QuestaoConcurso {
  id: string;
  tipo: 'multipla_escolha' | 'certo_errado' | 'caso_pratico' | 'comparativa' | string;
  artigo_id?: string;
  artigo_numero: string;
  assunto: string;
  dificuldade: 'facil' | 'medio' | 'dificil';
  prioridade: 'alta' | 'media' | 'baixa';
  enunciado: string;
  alternativas?: {
    A: string;
    B: string;
    C: string;
    D: string;
    E: string;
  };
  gabarito: 'A' | 'B' | 'C' | 'D' | 'E' | 'certo' | 'errado' | string;
  justificativa: string;
  justificativas_alternativas?: {
    A?: string;
    B?: string;
    C?: string;
    D?: string;
    E?: string;
  };
}

export interface ControleCobertura {
  total_artigos_elegiveis: number;
  artigos_com_material: number;
  artigos_sem_material: number;
  percentual_cobertura: number;
}

export interface ControleMetas {
  questoes_planejadas: number;
  questoes_geradas: number;
  questoes_pendentes: number;
  flashcards_planejados: number;
  flashcards_gerados: number;
}

export interface ParametrosGeracaoConcurso {
  sessao_id?: string;
  artigo_id?: string;
  artigos_filtro?: string[];
  banca?: string;
  modo?: 'adicionar' | 'substituir';
}

export interface LegislacaoMaterialConcurso {
  id: string;
  legislacao_id: string;
  user_id: string;
  pontos_de_prova?: any[];
  pegadinhas?: any[];
  conceitos_memorizacao?: any[];
  comparacoes?: any[];
  flashcards: FlashcardConcurso[];
  questoes: QuestaoConcurso[];
  metas?: ControleMetas | null;
  cobertura?: ControleCobertura | null;
  resumo?: any;
  alertas: string[];
  parametros: ParametrosGeracaoConcurso;
  status: 'pendente' | 'processando' | 'concluido' | 'erro';
  erro: string | null;
  created_at: string;
  updated_at: string;
}

@Injectable({ providedIn: 'root' })
export class LegislacaoService {
  private baseUrl = environment.apiUrl;

  constructor(
    private http: HttpClient,
    private supabaseService: SupabaseService,
  ) {}

  private getHeaders(): HttpHeaders {
    const token = this.supabaseService.accessToken;
    let headers = new HttpHeaders();
    if (token) headers = headers.set('Authorization', `Bearer ${token}`);
    return headers;
  }

  // ---------------------------------------------------------------
  // Backend API calls — Gerais
  // ---------------------------------------------------------------

  listar(): Observable<Legislacao[]> {
    const userId = this.supabaseService.currentUser?.id;
    if (!userId) return from(Promise.resolve([]));
    return this.http.get<Legislacao[]>(`${this.baseUrl}/legislacao?userId=${userId}`, {
      headers: this.getHeaders(),
    });
  }

  detalhar(id: string): Observable<Legislacao & { artigos: LegislacaoArtigo[]; processamentos: LegislacaoProcessamento[]; artigos_lidos?: string[] }> {
    const userId = this.supabaseService.currentUser?.id;
    const url = userId ? `${this.baseUrl}/legislacao/${id}?userId=${userId}` : `${this.baseUrl}/legislacao/${id}`;
    return this.http.get<any>(url, { headers: this.getHeaders() });
  }

  getArtigosLidos(legislacaoId: string): Observable<{ data: string[] }> {
    const userId = this.supabaseService.currentUser?.id;
    if (!userId) return from(Promise.resolve({ data: [] }));
    return this.http.get<any>(`${this.baseUrl}/legislacao/${legislacaoId}/artigos-lidos?userId=${userId}`, {
      headers: this.getHeaders(),
    });
  }

  toggleArtigoLido(
    legislacaoId: string,
    artigoId: string,
    artigoNumero: string,
    lido?: boolean,
  ): Observable<{ lido: boolean; artigos_lidos: string[] }> {
    const userId = this.supabaseService.currentUser?.id;
    if (!userId) throw new Error('Usuário não autenticado.');
    return this.http.post<any>(
      `${this.baseUrl}/legislacao/${legislacaoId}/artigos/${artigoId}/toggle-lido`,
      { userId, artigo_numero: artigoNumero, lido },
      { headers: this.getHeaders() },
    );
  }

  upload(file: File | null, titulo: string, tipo?: string, numero?: string, ano?: number, url?: string): Observable<{ data: Legislacao }> {
    const userId = this.supabaseService.currentUser?.id;
    if (!userId) throw new Error('Usuário não autenticado.');
    const form = new FormData();
    if (file) form.append('file', file);
    form.append('userId', userId);
    form.append('titulo', titulo);
    if (tipo) form.append('tipo', tipo);
    if (numero) form.append('numero', numero);
    if (ano) form.append('ano', String(ano));
    if (url) form.append('url', url);
    return this.http.post<any>(`${this.baseUrl}/legislacao/upload`, form, { headers: this.getHeaders() });
  }

  getComentario(legislacaoId: string, artigoId: string): Observable<{ data: LegislacaoComentario | null }> {
    return this.http.get<any>(`${this.baseUrl}/legislacao/${legislacaoId}/artigos/${artigoId}/comentario`, {
      headers: this.getHeaders(),
    });
  }

  reprocessarArtigo(legislacaoId: string, artigoId: string): Observable<any> {
    return this.http.post<any>(
      `${this.baseUrl}/legislacao/${legislacaoId}/artigos/${artigoId}/reprocessar`,
      {},
      { headers: this.getHeaders() },
    );
  }

  excluir(id: string): Observable<any> {
    return this.http.delete<any>(`${this.baseUrl}/legislacao/${id}`, { headers: this.getHeaders() });
  }

  // ---------------------------------------------------------------
  // Agente 3 — Analista Estratégico de Concursos
  // ---------------------------------------------------------------

  /** Busca a análise estratégica de concursos gerada pelo Agente 3. */
  getAnaliseEstrategica(legislacaoId: string): Observable<{ data: LegislacaoAnaliseEstrategica | null }> {
    const userId = this.supabaseService.currentUser?.id;
    if (!userId) return from(Promise.resolve({ data: null }));
    return this.http.get<any>(
      `${this.baseUrl}/legislacao/${legislacaoId}/analise-estrategica?userId=${userId}`,
      { headers: this.getHeaders() },
    );
  }

  /** Gera (ou regenera) a análise estratégica do Agente 3. */
  gerarAnaliseEstrategica(legislacaoId: string): Observable<{ message: string; data: LegislacaoAnaliseEstrategica }> {
    const userId = this.supabaseService.currentUser?.id;
    if (!userId) throw new Error('Usuário não autenticado.');
    return this.http.post<any>(
      `${this.baseUrl}/legislacao/${legislacaoId}/analise-estrategica`,
      { userId },
      { headers: this.getHeaders() },
    );
  }

  // ---------------------------------------------------------------
  // Agente 4 — Plano de Cronograma de Estudos
  // ---------------------------------------------------------------

  /** Busca o plano de cronograma existente para uma legislação. */
  getPlano(legislacaoId: string): Observable<{ data: LegislacaoPlano | null }> {
    const userId = this.supabaseService.currentUser?.id;
    if (!userId) return from(Promise.resolve({ data: null }));
    return this.http.get<any>(
      `${this.baseUrl}/legislacao/${legislacaoId}/plano?userId=${userId}`,
      { headers: this.getHeaders() },
    );
  }

  /** Gera (ou regenera) o plano de cronograma para uma legislação. */
  gerarPlano(legislacaoId: string, preferencias?: PreferenciasEstudante): Observable<{ message: string; data: LegislacaoPlano }> {
    const userId = this.supabaseService.currentUser?.id;
    if (!userId) throw new Error('Usuário não autenticado.');
    const body: any = { userId, ...preferencias };
    if (preferencias?.tempo_diario_minutos) {
      body.tempo_diario_minutos = String(preferencias.tempo_diario_minutos);
    }
    return this.http.post<any>(
      `${this.baseUrl}/legislacao/${legislacaoId}/plano`,
      body,
      { headers: this.getHeaders() },
    );
  }

  // ---------------------------------------------------------------
  // Agente 5 — Gerador de Questões e Fixação
  // ---------------------------------------------------------------

  /** Busca o material de fixação existente para uma legislação. */
  getMaterialConcurso(legislacaoId: string): Observable<{ data: LegislacaoMaterialConcurso | null }> {
    const userId = this.supabaseService.currentUser?.id;
    if (!userId) return from(Promise.resolve({ data: null }));
    return this.http.get<any>(
      `${this.baseUrl}/legislacao/${legislacaoId}/concurso?userId=${userId}`,
      { headers: this.getHeaders() },
    );
  }

  /** Gera (ou regenera) material de fixação para uma legislação ou sessão. */
  gerarMaterialConcurso(
    legislacaoId: string,
    opcoes?: ParametrosGeracaoConcurso,
  ): Observable<{ message: string; data: LegislacaoMaterialConcurso }> {
    const userId = this.supabaseService.currentUser?.id;
    if (!userId) throw new Error('Usuário não autenticado.');
    return this.http.post<any>(
      `${this.baseUrl}/legislacao/${legislacaoId}/concurso`,
      { userId, ...opcoes },
      { headers: this.getHeaders() },
    );
  }

  /** Gera material de fixação focado em um artigo específico. */
  gerarMaterialConcursoArtigo(
    legislacaoId: string,
    artigoId: string,
    banca?: string,
  ): Observable<{ message: string; data: LegislacaoMaterialConcurso }> {
    const userId = this.supabaseService.currentUser?.id;
    if (!userId) throw new Error('Usuário não autenticado.');
    return this.http.post<any>(
      `${this.baseUrl}/legislacao/${legislacaoId}/artigos/${artigoId}/concurso`,
      { userId, banca },
      { headers: this.getHeaders() },
    );
  }

  // ---------------------------------------------------------------
  // Supabase Realtime — subscription para atualização ao vivo
  // ---------------------------------------------------------------

  subscribeLegislacao(legislacaoId: string, callback: (payload: any) => void) {
    return this.supabaseService.client
      .channel(`legislacao-${legislacaoId}`)
      .on('postgres_changes', {
        event: '*',
        schema: 'public',
        table: 'legislacoes',
        filter: `id=eq.${legislacaoId}`,
      }, callback)
      .on('postgres_changes', {
        event: '*',
        schema: 'public',
        table: 'legislacao_processamentos',
        filter: `legislacao_id=eq.${legislacaoId}`,
      }, callback)
      .on('postgres_changes', {
        event: '*',
        schema: 'public',
        table: 'legislacao_comentarios',
        filter: `legislacao_id=eq.${legislacaoId}`,
      }, callback)
      .on('postgres_changes', {
        event: '*',
        schema: 'public',
        table: 'legislacao_analises_estrategicas',
        filter: `legislacao_id=eq.${legislacaoId}`,
      }, callback)
      .on('postgres_changes', {
        event: '*',
        schema: 'public',
        table: 'legislacao_materiais_concurso',
        filter: `legislacao_id=eq.${legislacaoId}`,
      }, callback)
      .subscribe();
  }

  unsubscribe(channel: any) {
    if (channel) {
      this.supabaseService.client.removeChannel(channel);
    }
  }

  // ---------------------------------------------------------------
  // Helpers
  // ---------------------------------------------------------------

  getStatusLabel(status: string): string {
    const map: Record<string, string> = {
      pendente: 'Pendente',
      extraindo: 'Extraindo...',
      extraida: 'Extraída',
      comentando: 'Comentando...',
      concluida: 'Concluída',
      erro: 'Erro',
    };
    return map[status] || status;
  }

  getStatusColor(status: string): string {
    const map: Record<string, string> = {
      pendente: '#94a3b8',
      extraindo: '#f59e0b',
      extraida: '#3b82f6',
      comentando: '#8b5cf6',
      concluida: '#10b981',
      erro: '#ef4444',
    };
    return map[status] || '#94a3b8';
  }

  getCommentStatusIcon(status: string): string {
    const map: Record<string, string> = {
      concluido: '✓',
      processando: '⏳',
      pendente: '○',
      erro: '✕',
    };
    return map[status] || '○';
  }

  getRelevanciaLabel(rel: string): string {
    return { alta: 'Alta', media: 'Média', baixa: 'Baixa' }[rel] || rel;
  }
}

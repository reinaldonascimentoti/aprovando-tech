/**
 * Tipos para o módulo de Legislação Brasileira e Preparação para Concursos.
 * Pipeline dos 5 Agentes:
 *  - Agente 1: Extrator de Legislação Brasileira
 *  - Agente 2: Comentador de Legislação Brasileira
 *  - Agente 3: Analista Estratégico de Concursos
 *  - Agente 4: Planejador e Gerenciador de Cronograma de Estudos
 *  - Agente 5: Gerador de Questões e Material de Fixação
 */

// ===============================================================
// AGENTE 1 — EXTRATOR DE LEGISLAÇÃO BRASILEIRA
// ===============================================================

export interface DispositivoExtraido {
  ordem: number;
  tipo: 'caput' | 'paragrafo' | 'paragrafo_unico' | 'inciso' | 'alinea' | 'item' | 'subitem' | string;
  numero: string | null;
  texto_original: string;
}

export interface ArtigoExtraido {
  ordem: number;
  numero: string;
  titulo: string | null;
  texto_original: string;
  status_dispositivo: string;
  dispositivos: DispositivoExtraido[];
}

export interface LegislacaoExtraidaJson {
  legislacao: {
    tipo: string | null;
    numero: string | null;
    ano: number | null;
    titulo: string | null;
    ementa: string | null;
    data_publicacao: string | null;
    data_vigencia: string | null;
    orgao_emissor: string | null;
    fonte: string | null;
  };
  estrutura: {
    preambulo: string | null;
    titulos: any[];
    capitulos: any[];
    secoes: any[];
    subsecoes: any[];
  };
  artigos: ArtigoExtraido[];
  anexos?: any[];
  qualidade_extracao: {
    status: 'completa' | 'parcial' | 'problemática' | string;
    problemas: any[];
  };
}

// ===============================================================
// AGENTE 2 — COMENTADOR DE LEGISLAÇÃO BRASILEIRA
// ===============================================================

export interface ComentarioArtigoJson {
  artigo_numero: string;
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
}

// ===============================================================
// AGENTE 3 — ANALISTA ESTRATÉGICO DE CONCURSOS
// ===============================================================

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
  id?: string;
  artigos: string[];
  motivo: string;
  foco: string;
  tipo_questao?: string;
}

export interface AnaliseEstrategicaJson {
  legislacao_id: string;
  meta_global: {
    meta_questoes_total: number;
    meta_flashcards_total: number;
  };
  analise_concurso: AnaliseArtigoConcurso[];
  comparacoes_recomendadas: ComparacaoRecomendada[];
}

export interface LegislacaoAnaliseEstrategicaRecord {
  id: string;
  legislacao_id: string;
  user_id: string;
  meta_global: AnaliseEstrategicaJson['meta_global'];
  analise_concurso: AnaliseArtigoConcurso[];
  comparacoes_recomendadas: ComparacaoRecomendada[];
  status: 'pendente' | 'processando' | 'concluido' | 'erro';
  erro: string | null;
  created_at: string;
  updated_at: string;
}

// ===============================================================
// AGENTE 4 — PLANEJADOR E GERENCIADOR DE CRONOGRAMA DE ESTUDOS
// ===============================================================

export interface PreferenciasEstudanteDto {
  data_inicio?: string;
  data_prova?: string;
  tempo_diario_minutos?: number;
  dias_disponiveis?: number[];
  nivel_estudante?: 'iniciante' | 'intermediario' | 'avancado' | string;
  objetivo?: string;
  prioridade_legislacao?: 'alta' | 'media' | 'baixa';
}

export interface PriorizacaoArtigo {
  artigo_id: string;
  artigo_numero: string;
  prioridade: 'alta' | 'media' | 'baixa';
  complexidade: 'alta' | 'media' | 'baixa';
  tempo_estimado_minutos: number;
  motivos: string[];
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
  tipo: 'leitura_inicial' | 'estudo_detalhado' | 'revisao_24h' | 'revisao_7_dias' | 'revisao_30_dias' | 'revisao_final' | 'consolidacao' | string;
  objetivo: string;
  artigos: string[];
  tempo_minutos: number;
  prioridade: 'alta' | 'media' | 'baixa';
  meta_questoes?: number;
}

export interface RevisaoEstudo {
  sessao_origem_id: string;
  tipo: 'revisao_24h' | 'revisao_7_dias' | 'revisao_30_dias' | 'revisao_final' | string;
  data: string;
  artigos: string[];
  tempo_minutos: number;
}

export interface PlanoEstudoJson {
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
  };
  priorizacao: PriorizacaoArtigo[];
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
  };
  alertas: string[];
}

export interface LegislacaoPlanoRecord {
  id: string;
  legislacao_id: string;
  user_id: string;
  plano_estudo: PlanoEstudoJson['plano_estudo'] | null;
  priorizacao: PriorizacaoArtigo[];
  blocos: BlocoEstudo[];
  sessoes: SessaoEstudo[];
  revisoes: RevisaoEstudo[];
  resumo: PlanoEstudoJson['resumo'] | null;
  alertas: string[];
  preferencias: PreferenciasEstudanteDto;
  status: 'pendente' | 'processando' | 'concluido' | 'erro';
  erro: string | null;
  created_at: string;
  updated_at: string;
}

// ===============================================================
// AGENTE 5 — GERADOR DE QUESTÕES E MATERIAL DE FIXAÇÃO
// ===============================================================

export interface FlashcardFixacao {
  id: string;
  artigo_id?: string;
  artigo_numero: string;
  pergunta: string;
  resposta: string;
  assunto: string;
  dificuldade: 'facil' | 'medio' | 'dificil';
  prioridade: 'alta' | 'media' | 'baixa';
}

export interface QuestaoFixacao {
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

export interface CasoPraticoFixacao {
  id: string;
  artigos: string[];
  titulo: string;
  cenario: string;
  pergunta: string;
  solucao_fundamentada: string;
  artigos_fundamentacao: string[];
}

export interface ControleCoberturaJson {
  total_artigos_elegiveis: number;
  artigos_com_material: number;
  artigos_sem_material: number;
  percentual_cobertura: number;
  artigos_excluidos?: Array<{ artigo_id: string; motivo: string }>;
}

export interface ControleMetasJson {
  questoes_planejadas: number;
  questoes_geradas: number;
  questoes_pendentes: number;
  flashcards_planejados: number;
  flashcards_gerados: number;
}

export interface MaterialFixacaoJson {
  legislacao_id: string;
  metas: ControleMetasJson;
  cobertura: ControleCoberturaJson;
  conteudos: {
    questoes: QuestaoFixacao[];
    flashcards: FlashcardFixacao[];
    casos_praticos?: CasoPraticoFixacao[];
    pontos_de_prova?: any[];
    pegadinhas?: any[];
    conceitos_memorizacao?: any[];
    comparacoes?: any[];
  };
  resumo?: any;
  alertas?: string[];
}

export interface ParametrosGeracaoFixacaoDto {
  sessao_id?: string;
  artigo_id?: string;
  artigos_filtro?: string[];
  banca?: string;
}

export interface LegislacaoMaterialConcursoRecord {
  id: string;
  legislacao_id: string;
  user_id: string;
  pontos_de_prova: any[];
  pegadinhas: any[];
  conceitos_memorizacao: any[];
  comparacoes: any[];
  flashcards: FlashcardFixacao[];
  questoes: QuestaoFixacao[];
  metas: ControleMetasJson | null;
  cobertura: ControleCoberturaJson | null;
  resumo: any;
  alertas: string[];
  parametros: ParametrosGeracaoFixacaoDto;
  status: 'pendente' | 'processando' | 'concluido' | 'erro';
  erro: string | null;
  created_at: string;
  updated_at: string;
}

// ---------------------------------------------------------------
// DTOs gerais de request
// ---------------------------------------------------------------

export interface CriarLegislacaoDto {
  titulo: string;
  tipo?: string;
  numero?: string;
  ano?: number;
  userId: string;
}

/**
 * Tipos para o módulo de Comentador de Legislação.
 * Agente 1: Extrator | Agente 2: Comentador | Agente 3: Planejador
 */

// ---------------------------------------------------------------
// Saída do Agente 1 (Extrator)
// ---------------------------------------------------------------

export interface DispositivoExtraido {
  ordem: number;
  tipo: 'caput' | 'paragrafo' | 'paragrafo_unico' | 'inciso' | 'alinea' | 'item' | 'subitem';
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
  qualidade_extracao: {
    status: 'completa' | 'parcial' | 'problemática';
    problemas: any[];
  };
}

// ---------------------------------------------------------------
// Saída do Agente 2 (Comentador)
// ---------------------------------------------------------------

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
  termos_juridicos: any[];
  referencias: any[];
  exemplo_pratico: string | null;
  relevancia_concurso: 'alta' | 'media' | 'baixa';
  observacao_interpretativa: string | null;
  grau_confianca: 'alta' | 'media' | 'baixa';
}

// ---------------------------------------------------------------
// DTOs de request
// ---------------------------------------------------------------

export interface CriarLegislacaoDto {
  titulo: string;
  tipo?: string;
  numero?: string;
  ano?: number;
  userId: string;
}

// ---------------------------------------------------------------
// Agente 3 — Planejador de Cronograma de Estudos
// ---------------------------------------------------------------

/**
 * Preferências opcionais do estudante.
 * Todos os campos são opcionais; o agente utilizará defaults quando ausentes.
 */
export interface PreferenciasEstudanteDto {
  /** Data de início do estudo (ISO 8601, ex: "2026-09-14") */
  data_inicio?: string;
  /** Data da prova (ISO 8601) */
  data_prova?: string;
  /** Minutos disponíveis por dia para esta legislação */
  tempo_diario_minutos?: number;
  /** Dias da semana disponíveis (0=Dom, 1=Seg, ... 6=Sáb) */
  dias_disponiveis?: number[];
  /** Nível de conhecimento prévio */
  nivel_estudante?: 'iniciante' | 'intermediario' | 'avancado';
  /** Objetivo principal */
  objetivo?: string;
  /** Prioridade desta legislação em relação às demais matérias */
  prioridade_legislacao?: 'alta' | 'media' | 'baixa';
}

/**
 * Priorização de um artigo individual gerada pelo Agente 3.
 */
export interface PriorizacaoArtigo {
  artigo_id: string;
  artigo_numero: string;
  prioridade: 'alta' | 'media' | 'baixa';
  complexidade: 'alta' | 'media' | 'baixa';
  tempo_estimado_minutos: number;
  motivos: string[];
}

/**
 * Bloco temático de estudo.
 */
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

/**
 * Sessão de estudo em uma data específica.
 */
export interface SessaoEstudo {
  id: string;
  ordem: number;
  data: string;             // ISO 8601 date
  bloco_id: string;
  tipo: 'leitura_inicial' | 'estudo_detalhado' | 'revisao_24h' | 'revisao_7_dias' | 'revisao_30_dias' | 'revisao_final' | 'consolidacao';
  objetivo: string;
  artigos: string[];
  tempo_minutos: number;
  prioridade: 'alta' | 'media' | 'baixa';
}

/**
 * Revisão espaçada vinculada a uma sessão de origem.
 */
export interface RevisaoEstudo {
  sessao_origem_id: string;
  tipo: 'revisao_24h' | 'revisao_7_dias' | 'revisao_30_dias' | 'revisao_final';
  data: string;             // ISO 8601 date
  artigos: string[];
  tempo_minutos: number;
}

/**
 * Estrutura completa do JSON retornado pelo Agente 3.
 */
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

/**
 * Registro da tabela legislacao_planos no banco.
 */
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

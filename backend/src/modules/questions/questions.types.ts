export interface AlternativaJson {
  letra: string;
  texto: string;
}

export interface QuestionJsonInput {
  id_qc?: string;
  disciplina?: string;
  banca?: string;
  ano?: number;
  orgao?: string;
  cargo?: string;
  assunto?: string;
  tipo?: 'multipla_escolha' | 'certo_errado' | string;
  enunciado?: string;
  alternativas?: AlternativaJson[];
  resposta_correta?: string;
  /** Alias de gabarito_comentado — aceito no upload JSON */
  justificativa?: string;
  gabarito_comentado?: string;
  imagem_url?: string | null;
  imagens?: string[];
  quality_metrics?: any;
  is_released?: boolean;
}

export interface QuestionJsonResponse {
  id?: number;
  id_qc: string;
  disciplina: string;
  banca: string | null;
  ano: number | null;
  orgao: string | null;
  cargo: string | null;
  assunto: string | null;
  tipo: string;
  enunciado: string;
  alternativas: AlternativaJson[];
  resposta_correta: string | null;
  /** Alias de gabarito_comentado — retornado na resposta */
  justificativa: string | null;
  gabarito_comentado: string | null;
  imagem_url: string | null;
  imagens: string[];
  quality_metrics: any;
  is_released: boolean;
  created_at?: string;
  updated_at?: string;
}

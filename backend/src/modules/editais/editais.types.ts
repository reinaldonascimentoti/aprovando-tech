/**
 * Contexto do candidato fornecido no upload de edital.
 * Utilizado pelo agente LLM para personalizar a análise Pareto
 * e pelo Supabase para persistência.
 */
export interface EditalUserContext {
  /** Cargo específico alvo da análise (obrigatório) */
  cargo: string;
  /** Nome do concurso (ex: SEFAZ-RS 2026) */
  concurso: string | null;
  /** Data da prova em formato ISO (YYYY-MM-DD) */
  dataProva: string | null;
  /** Horas de estudo disponíveis por dia */
  horasPorDia: number | null;
  /** Dias disponíveis para estudo por semana */
  diasPorSemana: number | null;
}

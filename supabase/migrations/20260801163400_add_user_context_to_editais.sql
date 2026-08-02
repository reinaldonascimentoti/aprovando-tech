-- ================================================================
-- Migration: Adiciona campos de contexto do candidato na tabela editais
-- Campos: concurso, data_prova, horas_por_dia, dias_por_semana
-- ================================================================

ALTER TABLE public.editais
  ADD COLUMN IF NOT EXISTS concurso      text,
  ADD COLUMN IF NOT EXISTS data_prova    date,
  ADD COLUMN IF NOT EXISTS horas_por_dia numeric(4,1),
  ADD COLUMN IF NOT EXISTS dias_por_semana integer;

-- Comentários das colunas para documentação
COMMENT ON COLUMN public.editais.concurso       IS 'Nome do concurso alvo (ex: SEFAZ-RS 2026)';
COMMENT ON COLUMN public.editais.data_prova      IS 'Data prevista da prova para cálculo de semanas disponíveis';
COMMENT ON COLUMN public.editais.horas_por_dia   IS 'Horas de estudo disponíveis por dia informadas pelo candidato';
COMMENT ON COLUMN public.editais.dias_por_semana IS 'Dias disponíveis para estudo por semana informados pelo candidato';

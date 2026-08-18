-- ================================================================
-- Migration: Adiciona a coluna id_qc à tabela questoes
-- Data: 2026-08-13
-- ================================================================

-- 1. Adiciona a coluna id_qc se não existir
ALTER TABLE public.questoes 
  ADD COLUMN IF NOT EXISTS id_qc text;

-- 2. Popula id_qc com o valor de codigo para questões existentes sem id_qc
UPDATE public.questoes 
  SET id_qc = codigo 
  WHERE id_qc IS NULL AND codigo IS NOT NULL;

-- 3. Cria índice para busca eficiente por id_qc
CREATE INDEX IF NOT EXISTS questoes_id_qc_idx 
  ON public.questoes (id_qc);

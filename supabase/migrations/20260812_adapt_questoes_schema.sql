-- ================================================================
-- Migration: Adaptação da Tabela questoes para Questões em JSON
-- Data: 2026-08-12
-- ================================================================

-- 1. Adiciona a coluna cargo se não existir
ALTER TABLE public.questoes 
  ADD COLUMN IF NOT EXISTS cargo text;

-- 2. Atualiza a restrição de validação da resposta_correta para aceitar opções A-E, C/E e Certo/Errado
ALTER TABLE public.questoes DROP CONSTRAINT IF EXISTS questoes_resposta_correta_valida;
ALTER TABLE public.questoes ADD CONSTRAINT questoes_resposta_correta_valida
  CHECK (
    resposta_correta IS NULL 
    OR resposta_correta IN ('A', 'B', 'C', 'D', 'E', 'C', 'E', 'Certo', 'Errado')
  );

-- 3. Atualiza a restrição de consistência de tipo e resposta para suportar variações de alternativas
ALTER TABLE public.questoes DROP CONSTRAINT IF EXISTS questoes_tipo_resposta_consistente;
ALTER TABLE public.questoes ADD CONSTRAINT questoes_tipo_resposta_consistente
  CHECK (
    tipo IN ('multipla_escolha', 'certo_errado')
    AND enunciado IS NOT NULL
  );

-- 4. Garante índice para busca eficiente por banca, órgão e ano
CREATE INDEX IF NOT EXISTS questoes_banca_orgao_ano_idx 
  ON public.questoes (banca, orgao, ano);

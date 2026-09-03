-- ====================================================================
-- Migration: Força o nome das disciplinas a sempre serem gravadas em CAIXA ALTA na tabela questoes
-- Data: 2026-08-28
-- ====================================================================

-- 1. Atualizar todos os registros existentes para caixa alta
UPDATE public.questoes 
SET disciplina = UPPER(TRIM(disciplina))
WHERE disciplina IS NOT NULL;

-- 2. Função de Trigger para garantir que qualquer inserção ou atualização grave disciplina em CAIXA ALTA
CREATE OR REPLACE FUNCTION public.trg_questoes_disciplina_upper()
RETURNS trigger AS $$
BEGIN
  IF NEW.disciplina IS NOT NULL THEN
    NEW.disciplina := UPPER(TRIM(NEW.disciplina));
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- 3. Criação do Trigger na tabela questoes
DROP TRIGGER IF EXISTS questoes_disciplina_upper_trigger ON public.questoes;

CREATE TRIGGER questoes_disciplina_upper_trigger
  BEFORE INSERT OR UPDATE OF disciplina ON public.questoes
  FOR EACH ROW
  EXECUTE FUNCTION public.trg_questoes_disciplina_upper();

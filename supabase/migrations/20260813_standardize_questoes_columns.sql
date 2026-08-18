-- ================================================================
-- Migration: Padronização das colunas da tabela questoes para 
-- corresponder exatamente às propriedades do JSON de upload.
-- Data: 2026-08-13
-- ================================================================

-- 1. Garante existência da coluna id_qc (identificador QC da questão)
ALTER TABLE public.questoes 
  ADD COLUMN IF NOT EXISTS id_qc text;

-- 2. Garante existência da coluna assunto (correspondente a "assunto" no JSON)
ALTER TABLE public.questoes 
  ADD COLUMN IF NOT EXISTS assunto text;

-- 3. Garante existência da coluna alternativas em formato JSONB
ALTER TABLE public.questoes 
  ADD COLUMN IF NOT EXISTS alternativas jsonb NOT NULL DEFAULT '[]'::jsonb;

-- 4. Garante existência da coluna gabarito_comentado
ALTER TABLE public.questoes 
  ADD COLUMN IF NOT EXISTS gabarito_comentado text;

-- 5. Garante existência das colunas de imagem (imagem_url e imagens)
ALTER TABLE public.questoes 
  ADD COLUMN IF NOT EXISTS imagem_url text;

ALTER TABLE public.questoes 
  ADD COLUMN IF NOT EXISTS imagens jsonb DEFAULT '[]'::jsonb;

-- 6. Popula e sincroniza colunas retroativamente para manter integridade
UPDATE public.questoes 
  SET 
    id_qc = COALESCE(id_qc, codigo),
    assunto = COALESCE(assunto, tema),
    gabarito_comentado = COALESCE(gabarito_comentado, explanation)
  WHERE 
    id_qc IS NULL OR assunto IS NULL OR gabarito_comentado IS NULL;

-- 7. Índices para busca otimizada nas colunas padronizadas
CREATE INDEX IF NOT EXISTS questoes_id_qc_idx ON public.questoes (id_qc);
CREATE INDEX IF NOT EXISTS questoes_assunto_idx ON public.questoes (assunto);
CREATE INDEX IF NOT EXISTS questoes_disciplina_assunto_idx ON public.questoes (disciplina, assunto);

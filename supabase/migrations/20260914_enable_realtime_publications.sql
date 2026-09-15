-- Habilita Realtime publication para as tabelas do módulo de Legislação
DO $$
BEGIN
  -- Adiciona legislacoes
  IF NOT EXISTS (
    SELECT 1 FROM pg_publication_tables 
    WHERE pubname = 'supabase_realtime' AND schemaname = 'public' AND tablename = 'legislacoes'
  ) THEN
    ALTER PUBLICATION supabase_realtime ADD TABLE public.legislacoes;
  END IF;

  -- Adiciona legislacao_processamentos
  IF NOT EXISTS (
    SELECT 1 FROM pg_publication_tables 
    WHERE pubname = 'supabase_realtime' AND schemaname = 'public' AND tablename = 'legislacao_processamentos'
  ) THEN
    ALTER PUBLICATION supabase_realtime ADD TABLE public.legislacao_processamentos;
  END IF;

  -- Adiciona legislacao_comentarios
  IF NOT EXISTS (
    SELECT 1 FROM pg_publication_tables 
    WHERE pubname = 'supabase_realtime' AND schemaname = 'public' AND tablename = 'legislacao_comentarios'
  ) THEN
    ALTER PUBLICATION supabase_realtime ADD TABLE public.legislacao_comentarios;
  END IF;

  -- Adiciona legislacao_analises_estrategicas
  IF NOT EXISTS (
    SELECT 1 FROM pg_publication_tables 
    WHERE pubname = 'supabase_realtime' AND schemaname = 'public' AND tablename = 'legislacao_analises_estrategicas'
  ) THEN
    ALTER PUBLICATION supabase_realtime ADD TABLE public.legislacao_analises_estrategicas;
  END IF;

  -- Adiciona legislacao_planos
  IF NOT EXISTS (
    SELECT 1 FROM pg_publication_tables 
    WHERE pubname = 'supabase_realtime' AND schemaname = 'public' AND tablename = 'legislacao_planos'
  ) THEN
    ALTER PUBLICATION supabase_realtime ADD TABLE public.legislacao_planos;
  END IF;

  -- Adiciona legislacao_materiais_concurso
  IF NOT EXISTS (
    SELECT 1 FROM pg_publication_tables 
    WHERE pubname = 'supabase_realtime' AND schemaname = 'public' AND tablename = 'legislacao_materiais_concurso'
  ) THEN
    ALTER PUBLICATION supabase_realtime ADD TABLE public.legislacao_materiais_concurso;
  END IF;
END $$;

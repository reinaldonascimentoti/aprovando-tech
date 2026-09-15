-- ================================================================
-- Aprovando Tech — Agente 4: Especialista em Concursos (Legislação)
-- Tabela: legislacao_materiais_concurso
-- ================================================================

-- ---------------------------------------------------------------
-- 1. TABELA LEGISLACAO_MATERIAIS_CONCURSO
-- ---------------------------------------------------------------
create table if not exists public.legislacao_materiais_concurso (
  id                    uuid primary key default gen_random_uuid(),
  legislacao_id         uuid not null references public.legislacoes(id) on delete cascade,
  user_id               uuid not null references auth.users(id) on delete cascade,

  -- Conteúdo gerado pelo Agente 4
  pontos_de_prova       jsonb default '[]'::jsonb,   -- pontos de prova com potencial de cobrança
  pegadinhas            jsonb default '[]'::jsonb,   -- armadilhas e formas de alteração pelo examinador
  conceitos_memorizacao jsonb default '[]'::jsonb,   -- prazos, números, listas e estratégias de memorização
  comparacoes           jsonb default '[]'::jsonb,   -- contrastes e semelhanças entre dispositivos
  flashcards            jsonb default '[]'::jsonb,   -- flashcards objetivos para revisão
  questoes              jsonb default '[]'::jsonb,   -- questões múltipla escolha e certo/errado com justificativas
  resumo                jsonb default '{}'::jsonb,   -- totais e estatísticas de conteúdo
  alertas               jsonb default '[]'::jsonb,   -- avisos de qualidade e dependências

  -- Metadados de filtro / escopo usado na geração
  parametros            jsonb default '{}'::jsonb,   -- sessao_id, artigos_filtro, banca, etc.

  -- Controle de processamento
  status                text not null default 'pendente'
                          check (status in ('pendente','processando','concluido','erro')),
  erro                  text,

  created_at            timestamptz not null default now(),
  updated_at            timestamptz not null default now(),

  -- Garante um registro consolidado por legislação+usuário
  unique (legislacao_id, user_id)
);

-- ---------------------------------------------------------------
-- 2. ÍNDICES
-- ---------------------------------------------------------------
create index idx_legislacao_materiais_concurso_legislacao_id
  on public.legislacao_materiais_concurso(legislacao_id);

create index idx_legislacao_materiais_concurso_user_id
  on public.legislacao_materiais_concurso(user_id);

-- ---------------------------------------------------------------
-- 3. TRIGGER updated_at
-- ---------------------------------------------------------------
create trigger legislacao_materiais_concurso_updated_at
  before update on public.legislacao_materiais_concurso
  for each row execute function public.set_updated_at();

-- ---------------------------------------------------------------
-- 4. ROW LEVEL SECURITY
-- ---------------------------------------------------------------
alter table public.legislacao_materiais_concurso enable row level security;

create policy "legislacao_materiais_concurso_select_own"
  on public.legislacao_materiais_concurso for select
  to authenticated
  using ( (select auth.uid()) = user_id );

create policy "legislacao_materiais_concurso_insert_own"
  on public.legislacao_materiais_concurso for insert
  to authenticated
  with check ( (select auth.uid()) = user_id );

create policy "legislacao_materiais_concurso_update_own"
  on public.legislacao_materiais_concurso for update
  to authenticated
  using ( (select auth.uid()) = user_id )
  with check ( (select auth.uid()) = user_id );

create policy "legislacao_materiais_concurso_delete_own"
  on public.legislacao_materiais_concurso for delete
  to authenticated
  using ( (select auth.uid()) = user_id );

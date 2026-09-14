-- ================================================================
-- Aprovando Tech — Comentador de Legislação
-- Tabelas: legislacoes, legislacao_artigos, legislacao_comentarios,
--          legislacao_processamentos
-- ================================================================

-- ---------------------------------------------------------------
-- 1. TABELA LEGISLACOES
-- ---------------------------------------------------------------
create table if not exists public.legislacoes (
  id               uuid primary key default gen_random_uuid(),
  user_id          uuid not null references auth.users(id) on delete cascade,
  tipo             text,
  numero           text,
  ano              integer,
  titulo           text not null,
  ementa           text,
  data_publicacao  date,
  data_vigencia    date,
  orgao_emissor    text,
  fonte            text,
  arquivo_path     text,
  arquivo_nome     text,
  status           text not null default 'pendente'
                     check (status in ('pendente','extraindo','extraida','comentando','concluida','erro')),
  created_at       timestamptz not null default now(),
  updated_at       timestamptz not null default now()
);

create trigger legislacoes_updated_at
  before update on public.legislacoes
  for each row execute function public.set_updated_at();

alter table public.legislacoes enable row level security;

create policy "legislacoes_select_own"
  on public.legislacoes for select
  to authenticated
  using ( (select auth.uid()) = user_id );

create policy "legislacoes_insert_own"
  on public.legislacoes for insert
  to authenticated
  with check ( (select auth.uid()) = user_id );

create policy "legislacoes_update_own"
  on public.legislacoes for update
  to authenticated
  using ( (select auth.uid()) = user_id )
  with check ( (select auth.uid()) = user_id );

create policy "legislacoes_delete_own"
  on public.legislacoes for delete
  to authenticated
  using ( (select auth.uid()) = user_id );

-- ---------------------------------------------------------------
-- 2. TABELA LEGISLACAO_ARTIGOS
-- ---------------------------------------------------------------
create table if not exists public.legislacao_artigos (
  id                 uuid primary key default gen_random_uuid(),
  legislacao_id      uuid not null references public.legislacoes(id) on delete cascade,
  ordem              integer not null,
  numero             text,
  titulo             text,
  texto_original     text not null,
  status_dispositivo text not null default 'vigente_no_documento',
  estrutura          jsonb default '{}'::jsonb,
  created_at         timestamptz not null default now(),
  updated_at         timestamptz not null default now()
);

create index idx_legislacao_artigos_legislacao_id
  on public.legislacao_artigos(legislacao_id);

create index idx_legislacao_artigos_ordem
  on public.legislacao_artigos(legislacao_id, ordem);

create trigger legislacao_artigos_updated_at
  before update on public.legislacao_artigos
  for each row execute function public.set_updated_at();

alter table public.legislacao_artigos enable row level security;

create policy "legislacao_artigos_select_own"
  on public.legislacao_artigos for select
  to authenticated
  using (
    exists (
      select 1 from public.legislacoes l
      where l.id = legislacao_id
        and (select auth.uid()) = l.user_id
    )
  );

create policy "legislacao_artigos_insert_own"
  on public.legislacao_artigos for insert
  to authenticated
  with check (
    exists (
      select 1 from public.legislacoes l
      where l.id = legislacao_id
        and (select auth.uid()) = l.user_id
    )
  );

create policy "legislacao_artigos_update_own"
  on public.legislacao_artigos for update
  to authenticated
  using (
    exists (
      select 1 from public.legislacoes l
      where l.id = legislacao_id
        and (select auth.uid()) = l.user_id
    )
  )
  with check (
    exists (
      select 1 from public.legislacoes l
      where l.id = legislacao_id
        and (select auth.uid()) = l.user_id
    )
  );

create policy "legislacao_artigos_delete_own"
  on public.legislacao_artigos for delete
  to authenticated
  using (
    exists (
      select 1 from public.legislacoes l
      where l.id = legislacao_id
        and (select auth.uid()) = l.user_id
    )
  );

-- ---------------------------------------------------------------
-- 3. TABELA LEGISLACAO_COMENTARIOS
-- ---------------------------------------------------------------
create table if not exists public.legislacao_comentarios (
  id                       uuid primary key default gen_random_uuid(),
  legislacao_id            uuid not null references public.legislacoes(id) on delete cascade,
  artigo_id                uuid not null references public.legislacao_artigos(id) on delete cascade,
  resumo                   text,
  explicacao_simples       text,
  comentario_tecnico       text,
  direitos                 jsonb default '[]'::jsonb,
  obrigacoes               jsonb default '[]'::jsonb,
  proibicoes               jsonb default '[]'::jsonb,
  permissoes               jsonb default '[]'::jsonb,
  requisitos               jsonb default '[]'::jsonb,
  condicoes                jsonb default '[]'::jsonb,
  competencias             jsonb default '[]'::jsonb,
  prazos                   jsonb default '[]'::jsonb,
  excecoes                 jsonb default '[]'::jsonb,
  consequencias            jsonb default '[]'::jsonb,
  pontos_importantes       jsonb default '[]'::jsonb,
  pontos_atencao           jsonb default '[]'::jsonb,
  termos_juridicos         jsonb default '[]'::jsonb,
  referencias              jsonb default '[]'::jsonb,
  exemplo_pratico          text,
  relevancia_concurso      text default 'media' check (relevancia_concurso in ('alta','media','baixa')),
  observacao_interpretativa text,
  grau_confianca           text default 'alta' check (grau_confianca in ('alta','media','baixa')),
  status                   text not null default 'pendente'
                             check (status in ('pendente','processando','concluido','erro')),
  erro                     text,
  created_at               timestamptz not null default now(),
  updated_at               timestamptz not null default now(),
  unique (artigo_id)
);

create index idx_legislacao_comentarios_legislacao_id
  on public.legislacao_comentarios(legislacao_id);

create index idx_legislacao_comentarios_artigo_id
  on public.legislacao_comentarios(artigo_id);

create trigger legislacao_comentarios_updated_at
  before update on public.legislacao_comentarios
  for each row execute function public.set_updated_at();

alter table public.legislacao_comentarios enable row level security;

create policy "legislacao_comentarios_select_own"
  on public.legislacao_comentarios for select
  to authenticated
  using (
    exists (
      select 1 from public.legislacoes l
      where l.id = legislacao_id
        and (select auth.uid()) = l.user_id
    )
  );

create policy "legislacao_comentarios_insert_own"
  on public.legislacao_comentarios for insert
  to authenticated
  with check (
    exists (
      select 1 from public.legislacoes l
      where l.id = legislacao_id
        and (select auth.uid()) = l.user_id
    )
  );

create policy "legislacao_comentarios_update_own"
  on public.legislacao_comentarios for update
  to authenticated
  using (
    exists (
      select 1 from public.legislacoes l
      where l.id = legislacao_id
        and (select auth.uid()) = l.user_id
    )
  )
  with check (
    exists (
      select 1 from public.legislacoes l
      where l.id = legislacao_id
        and (select auth.uid()) = l.user_id
    )
  );

create policy "legislacao_comentarios_delete_own"
  on public.legislacao_comentarios for delete
  to authenticated
  using (
    exists (
      select 1 from public.legislacoes l
      where l.id = legislacao_id
        and (select auth.uid()) = l.user_id
    )
  );

-- ---------------------------------------------------------------
-- 4. TABELA LEGISLACAO_PROCESSAMENTOS
-- ---------------------------------------------------------------
create table if not exists public.legislacao_processamentos (
  id                   uuid primary key default gen_random_uuid(),
  legislacao_id        uuid not null references public.legislacoes(id) on delete cascade,
  etapa                text not null check (etapa in ('extracao','comentarios','finalizacao')),
  status               text not null default 'pendente'
                         check (status in ('pendente','processando','concluido','erro')),
  quantidade_total     integer default 0,
  quantidade_processada integer default 0,
  erro                 text,
  created_at           timestamptz not null default now(),
  updated_at           timestamptz not null default now()
);

create index idx_legislacao_processamentos_legislacao_id
  on public.legislacao_processamentos(legislacao_id);

create trigger legislacao_processamentos_updated_at
  before update on public.legislacao_processamentos
  for each row execute function public.set_updated_at();

alter table public.legislacao_processamentos enable row level security;

create policy "legislacao_processamentos_select_own"
  on public.legislacao_processamentos for select
  to authenticated
  using (
    exists (
      select 1 from public.legislacoes l
      where l.id = legislacao_id
        and (select auth.uid()) = l.user_id
    )
  );

create policy "legislacao_processamentos_insert_own"
  on public.legislacao_processamentos for insert
  to authenticated
  with check (
    exists (
      select 1 from public.legislacoes l
      where l.id = legislacao_id
        and (select auth.uid()) = l.user_id
    )
  );

create policy "legislacao_processamentos_update_own"
  on public.legislacao_processamentos for update
  to authenticated
  using (
    exists (
      select 1 from public.legislacoes l
      where l.id = legislacao_id
        and (select auth.uid()) = l.user_id
    )
  )
  with check (
    exists (
      select 1 from public.legislacoes l
      where l.id = legislacao_id
        and (select auth.uid()) = l.user_id
    )
  );

-- ---------------------------------------------------------------
-- 5. STORAGE BUCKET para legislações
-- ---------------------------------------------------------------
insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values (
  'legislacao',
  'legislacao',
  false,
  52428800,  -- 50MB
  array['application/pdf','text/plain','application/msword',
        'application/vnd.openxmlformats-officedocument.wordprocessingml.document']
)
on conflict (id) do nothing;

-- RLS policies para storage.objects do bucket 'legislacao'
create policy "legislacao_storage_insert_own"
  on storage.objects for insert
  to authenticated
  with check (
    bucket_id = 'legislacao'
    and (storage.foldername(name))[1] = (select auth.uid()::text)
  );

create policy "legislacao_storage_select_own"
  on storage.objects for select
  to authenticated
  using (
    bucket_id = 'legislacao'
    and (storage.foldername(name))[1] = (select auth.uid()::text)
  );

create policy "legislacao_storage_update_own"
  on storage.objects for update
  to authenticated
  using (
    bucket_id = 'legislacao'
    and (storage.foldername(name))[1] = (select auth.uid()::text)
  );

create policy "legislacao_storage_delete_own"
  on storage.objects for delete
  to authenticated
  using (
    bucket_id = 'legislacao'
    and (storage.foldername(name))[1] = (select auth.uid()::text)
  );

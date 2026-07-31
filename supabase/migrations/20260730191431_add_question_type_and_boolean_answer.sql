-- Adiciona novas colunas para o novo modelo de questões
alter table public.questoes
  add column if not exists tipo text not null default 'multipla_escolha',
  add column if not exists alternativa_a text,
  add column if not exists alternativa_b text,
  add column if not exists alternativa_c text,
  add column if not exists alternativa_d text,
  add column if not exists resposta_boolean boolean;

-- Identifica e ajusta o tipo para questões que eram na verdade certo/errado (menos de 4 alternativas)
update public.questoes
set
  tipo = 'certo_errado',
  resposta_boolean = case
    when resposta_correta = 'A' and (alternativas -> 0 ->> 'texto') = 'Errado' then false
    else true
  end,
  resposta_correta = null
where alternativas is not null 
  and jsonb_typeof(alternativas) = 'array'
  and jsonb_array_length(alternativas) < 4;

-- Migra dados de múltipla escolha existentes para as colunas individuais
update public.questoes
set
  alternativa_a = (select texto from jsonb_to_recordset(alternativas) as x(letra text, texto text) where letra = 'A'),
  alternativa_b = (select texto from jsonb_to_recordset(alternativas) as x(letra text, texto text) where letra = 'B'),
  alternativa_c = (select texto from jsonb_to_recordset(alternativas) as x(letra text, texto text) where letra = 'C'),
  alternativa_d = (select texto from jsonb_to_recordset(alternativas) as x(letra text, texto text) where letra = 'D')
where tipo = 'multipla_escolha' 
  and alternativas is not null 
  and jsonb_typeof(alternativas) = 'array';

-- Remove a coluna de alternativas JSONB antiga
alter table public.questoes drop column if exists alternativas;

-- Atualiza a restrição de resposta_correta para aceitar apenas A, B, C ou D
alter table public.questoes drop constraint if exists questoes_resposta_correta_valida;
alter table public.questoes add constraint questoes_resposta_correta_valida
  check (resposta_correta is null or resposta_correta in ('A', 'B', 'C', 'D'));

-- Remove restrições antigas caso existam
alter table public.questoes drop constraint if exists questoes_tipo_valido;
alter table public.questoes drop constraint if exists questoes_tipo_resposta_consistente;

-- Adiciona novas restrições de validação e consistência
alter table public.questoes add constraint questoes_tipo_valido
  check (tipo in ('multipla_escolha', 'certo_errado'));

alter table public.questoes add constraint questoes_tipo_resposta_consistente
  check (
    (
      tipo = 'multipla_escolha'
      and alternativa_a is not null
      and alternativa_b is not null
      and alternativa_c is not null
      and alternativa_d is not null
      and resposta_correta is not null
      and resposta_boolean is null
    )
    or (
      tipo = 'certo_errado'
      and alternativa_a is null
      and alternativa_b is null
      and alternativa_c is null
      and alternativa_d is null
      and resposta_correta is null
      and resposta_boolean is not null
    )
  );

-- Adiciona alternativa_e
alter table public.questoes
  add column if not exists alternativa_e text;

-- Atualiza a restrição de resposta_correta para aceitar A, B, C, D ou E
alter table public.questoes drop constraint if exists questoes_resposta_correta_valida;
alter table public.questoes add constraint questoes_resposta_correta_valida
  check (resposta_correta is null or resposta_correta in ('A', 'B', 'C', 'D', 'E'));

-- Atualiza a restrição de consistência para incluir alternativa_e como opcional na múltipla escolha e nula em certo_errado
alter table public.questoes drop constraint if exists questoes_tipo_resposta_consistente;
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
      and alternativa_e is null
      and resposta_correta is null
      and resposta_boolean is not null
    )
  );

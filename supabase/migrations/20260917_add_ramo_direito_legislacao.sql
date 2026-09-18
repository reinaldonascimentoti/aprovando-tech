-- Migration: 20260917_add_ramo_direito_legislacao.sql

alter table public.legislacoes add column ramo_direito text;

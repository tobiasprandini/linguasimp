alter table public.sentences
  add column if not exists language_code text not null default 'en';

alter table public.blocks
  add column if not exists language_code text not null default 'en';

alter table public.sentences
  add column if not exists context_tags text[] default '{}';

alter table public.blocks
  add column if not exists pronunciation_hint text;

alter table public.blocks
  add column if not exists contextual_tip text;

create index if not exists idx_sentences_language_code
  on public.sentences (language_code);

create index if not exists idx_blocks_language_code
  on public.blocks (language_code);

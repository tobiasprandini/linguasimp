create table if not exists public.blocks (
  id text primary key,
  language_code text not null,
  canonical_text text not null,
  core_meaning text,
  pronunciation_hint text,
  contextual_tip text,
  block_type text,
  tags text[] default '{}',
  audio_path text,
  created_at timestamptz not null default now()
);

alter table public.blocks
  add column if not exists language_code text not null default 'en';

alter table public.blocks
  add column if not exists pronunciation_hint text;

alter table public.blocks
  add column if not exists contextual_tip text;

create index if not exists idx_blocks_language_code
  on public.blocks (language_code);

alter table public.blocks enable row level security;

create policy "Public read access for blocks"
on public.blocks
for select
to public
using (true);

insert into storage.buckets (id, name, public)
values ('block-audio', 'block-audio', true)
on conflict (id) do nothing;

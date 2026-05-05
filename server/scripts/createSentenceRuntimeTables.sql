create table if not exists public.sentences (
  id text primary key,
  language_code text not null,
  lesson_id text not null default 'lesson_1',
  text text not null,
  translation text not null,
  level text,
  difficulty_score numeric(4,2),
  naturalness_score numeric(4,2),
  topic_tags text[] default '{}',
  grammar_tags text[] default '{}',
  context_tags text[] default '{}',
  audio_path text,
  speech_speed numeric(3,2) not null default 1.00,
  status text not null default 'draft',
  source text default 'manual',
  created_at timestamptz not null default now()
);

alter table public.sentences
  add column if not exists language_code text not null default 'en';

alter table public.sentences
  add column if not exists context_tags text[] default '{}';

alter table public.sentences
  add column if not exists lesson_id text not null default 'lesson_1';

alter table public.sentences
  add column if not exists speech_speed numeric(3,2) not null default 1.00;

alter table public.sentences
  drop constraint if exists sentences_speech_speed_check;

alter table public.sentences
  add constraint sentences_speech_speed_check
  check (speech_speed >= 0.70 and speech_speed <= 1.20);

create index if not exists idx_sentences_language_code
  on public.sentences (language_code);

create index if not exists idx_sentences_language_lesson
  on public.sentences (language_code, lesson_id);

update public.sentences
set lesson_id = 'lesson_1'
where language_code = 'fr';

create index if not exists idx_sentences_level
  on public.sentences (level);

alter table public.sentences
  add constraint sentences_status_check
  check (status in ('draft', 'reviewed', 'published', 'archived'));

alter table public.sentences
  add constraint sentences_source_check
  check (source in ('manual', 'ai_generated', 'edited'));

alter table public.sentences enable row level security;

create policy "Public read access for sentences"
on public.sentences
for select
to public
using (true);

create table if not exists public.sentence_blocks (
  id text primary key,
  sentence_id text not null references public.sentences(id) on delete cascade,
  block_id text not null references public.blocks(id) on delete restrict,
  surface text not null,
  contextual_gloss text,
  order_index integer not null,
  created_at timestamptz not null default now()
);

create index if not exists idx_sentence_blocks_sentence_id
  on public.sentence_blocks (sentence_id);

create index if not exists idx_sentence_blocks_block_id
  on public.sentence_blocks (block_id);

create unique index if not exists idx_sentence_blocks_sentence_order
  on public.sentence_blocks (sentence_id, order_index);

alter table public.sentence_blocks enable row level security;

create policy "Public read access for sentence_blocks"
on public.sentence_blocks
for select
to public
using (true);

insert into storage.buckets (id, name, public)
values ('sentence-audio', 'sentence-audio', true)
on conflict (id) do nothing;

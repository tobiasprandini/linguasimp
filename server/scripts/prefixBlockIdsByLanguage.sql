-- Prefix old language-agnostic block ids with their language code.
-- Example: blk_un-film -> blk_fr_un-film / blk_it_un-film.
--
-- Use this when old auto-generated block ids caused equal text in different
-- languages to share the same block. The script creates one block per language
-- usage and relinks sentence_blocks according to the sentence language.

begin;

create temporary table linked_block_id_renames as
select distinct
  sentence_blocks.block_id as old_id,
  sentences.language_code,
  'blk_' || sentences.language_code || '_' || regexp_replace(sentence_blocks.block_id, '^blk_', '') as new_id,
  coalesce(nullif(sentence_blocks.surface, ''), blocks.canonical_text) as canonical_text,
  coalesce(nullif(sentence_blocks.contextual_gloss, ''), blocks.core_meaning, '') as core_meaning,
  blocks.pronunciation_hint,
  coalesce(
    blocks.block_type,
    case
      when coalesce(nullif(sentence_blocks.surface, ''), blocks.canonical_text) like '% %'
        then 'chunk'
      else 'word'
    end
  ) as block_type,
  coalesce(blocks.tags, '{}'::text[]) as tags,
  case
    when blocks.language_code = sentences.language_code then blocks.audio_path
    else null
  end as audio_path,
  blocks.created_at
from public.sentence_blocks sentence_blocks
join public.sentences sentences on sentences.id = sentence_blocks.sentence_id
join public.blocks blocks on blocks.id = sentence_blocks.block_id
where sentence_blocks.block_id like 'blk_%'
  and sentence_blocks.block_id !~ '^blk_(en|es|fr|de|it|ru|no|el|zh|ja)_';

insert into public.blocks (
  id,
  language_code,
  canonical_text,
  core_meaning,
  pronunciation_hint,
  block_type,
  tags,
  audio_path,
  created_at
)
select
  new_id,
  language_code,
  canonical_text,
  core_meaning,
  pronunciation_hint,
  block_type,
  tags,
  audio_path,
  coalesce(created_at, now())
from linked_block_id_renames
on conflict (id) do nothing;

update public.sentence_blocks sentence_blocks
set block_id = renames.new_id
from linked_block_id_renames renames
join public.sentences sentences on sentences.language_code = renames.language_code
where sentence_blocks.block_id = renames.old_id
  and sentence_blocks.sentence_id = sentences.id;

create temporary table standalone_block_id_renames as
select
  blocks.id as old_id,
  blocks.language_code,
  'blk_' || blocks.language_code || '_' || regexp_replace(blocks.id, '^blk_', '') as new_id
from public.blocks blocks
where blocks.id like 'blk_%'
  and blocks.id !~ '^blk_(en|es|fr|de|it|ru|no|el|zh|ja)_'
  and not exists (
    select 1
    from public.sentence_blocks sentence_blocks
    where sentence_blocks.block_id = blocks.id
  );

insert into public.blocks (
  id,
  language_code,
  canonical_text,
  core_meaning,
  pronunciation_hint,
  block_type,
  tags,
  audio_path,
  created_at
)
select
  renames.new_id,
  blocks.language_code,
  blocks.canonical_text,
  blocks.core_meaning,
  blocks.pronunciation_hint,
  blocks.block_type,
  blocks.tags,
  blocks.audio_path,
  blocks.created_at
from public.blocks blocks
join standalone_block_id_renames renames on renames.old_id = blocks.id
on conflict (id) do nothing;

delete from public.blocks blocks
where blocks.id like 'blk_%'
  and blocks.id !~ '^blk_(en|es|fr|de|it|ru|no|el|zh|ja)_'
  and not exists (
    select 1
    from public.sentence_blocks sentence_blocks
    where sentence_blocks.block_id = blocks.id
  );

commit;

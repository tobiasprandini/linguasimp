alter table public.sentences
  add column if not exists lesson_id text not null default 'lesson_1';

create index if not exists idx_sentences_language_lesson
  on public.sentences (language_code, lesson_id);

update public.sentences
set lesson_id = 'lesson_1'
where id in (
  'sent_a1_001',
  'sent_a1_002',
  'sent_a1_003',
  'sent_a1_004',
  'sent_a1_005',
  'sent_a1_006',
  'sent_a1_007',
  'sent_a1_009',
  'sent_a1_021',
  'sent_a1_022'
);

update public.sentences
set lesson_id = 'lesson_2'
where id in (
  'sent_a1_010',
  'sent_a1_011',
  'sent_a1_012',
  'sent_a1_013',
  'sent_a1_014',
  'sent_a1_015',
  'sent_a1_016',
  'sent_a1_027',
  'sent_a1_028',
  'sent_a1_029'
);

update public.sentences
set lesson_id = 'lesson_3'
where id in (
  'sent_a1_017',
  'sent_a1_018',
  'sent_a1_019',
  'sent_a1_020',
  'sent_a1_023',
  'sent_a1_024',
  'sent_a1_025',
  'sent_a1_026'
);

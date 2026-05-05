alter table public.sentences
  add column if not exists speech_speed numeric(3,2) not null default 1.00;

alter table public.sentences
  drop constraint if exists sentences_speech_speed_check;

alter table public.sentences
  add constraint sentences_speech_speed_check
  check (speech_speed >= 0.70 and speech_speed <= 1.20);

create table if not exists public.user_lesson_progress (
  user_id uuid not null references auth.users(id) on delete cascade,
  language_code text not null,
  active_lesson_id text not null default 'lesson_1',
  completed_lesson_ids text[] not null default '{}',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  primary key (user_id, language_code)
);

alter table public.user_lesson_progress enable row level security;

do $$
begin
  if not exists (
    select 1 from pg_policies
    where schemaname = 'public'
      and tablename = 'user_lesson_progress'
      and policyname = 'Users can read their own lesson progress'
  ) then
    create policy "Users can read their own lesson progress"
    on public.user_lesson_progress
    for select
    to authenticated
    using (auth.uid() = user_id);
  end if;

  if not exists (
    select 1 from pg_policies
    where schemaname = 'public'
      and tablename = 'user_lesson_progress'
      and policyname = 'Users can insert their own lesson progress'
  ) then
    create policy "Users can insert their own lesson progress"
    on public.user_lesson_progress
    for insert
    to authenticated
    with check (auth.uid() = user_id);
  end if;

  if not exists (
    select 1 from pg_policies
    where schemaname = 'public'
      and tablename = 'user_lesson_progress'
      and policyname = 'Users can update their own lesson progress'
  ) then
    create policy "Users can update their own lesson progress"
    on public.user_lesson_progress
    for update
    to authenticated
    using (auth.uid() = user_id)
    with check (auth.uid() = user_id);
  end if;
end $$;

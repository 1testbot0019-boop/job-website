-- Exam master catalog for the Government Jobs / Results / MCQ website
create table if not exists public.exams (
  id uuid primary key default gen_random_uuid(),
  slug text not null unique,
  exam_name text not null,
  short_name text,
  conducting_body text not null,
  category text not null,
  qualification text,
  level text not null default 'National',
  state text not null default 'Central',
  official_website text,
  notification_url text,
  application_url text,
  admit_card_url text,
  result_url text,
  syllabus_url text,
  previous_papers_url text,
  description text,
  is_active boolean not null default true,
  source_type text not null default 'Official organization portal',
  last_verified date not null default current_date,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists exams_state_idx on public.exams(state);
create index if not exists exams_category_idx on public.exams(category);
create index if not exists exams_level_idx on public.exams(level);
create index if not exists exams_active_idx on public.exams(is_active);
create index if not exists exams_body_idx on public.exams(conducting_body);

alter table public.exams enable row level security;
drop policy if exists "public can read active exams" on public.exams;
create policy "public can read active exams"
on public.exams for select to anon, authenticated
using (is_active = true);

create or replace function public.set_exams_updated_at()
returns trigger language plpgsql as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

drop trigger if exists exams_set_updated_at on public.exams;
create trigger exams_set_updated_at
before update on public.exams
for each row execute function public.set_exams_updated_at();

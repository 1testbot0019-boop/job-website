-- Jobs + Government Schemes database schema
create extension if not exists "pgcrypto";

create table if not exists updates (
 id uuid primary key default gen_random_uuid(), title text not null, slug text not null unique,
 category text not null check (category in ('JOB','RESULT','ADMIT_CARD','ANSWER_KEY','NOTIFICATION','SYLLABUS','PREVIOUS_PAPER')),
 department text not null, description text, important_dates jsonb default '{}'::jsonb, published_date date,
 source_url text not null, official_url text not null, pdf_url text, content_hash text not null unique,
 is_active boolean default true, created_at timestamptz default now(), last_updated timestamptz default now()
);
alter table updates add column if not exists notification_details jsonb default '{}'::jsonb;
alter table updates add column if not exists vacancy_details jsonb default '[]'::jsonb;
alter table updates add column if not exists eligibility text;
alter table updates add column if not exists age_limit text;
alter table updates add column if not exists application_fee text;
alter table updates add column if not exists selection_process text;
alter table updates add column if not exists how_to_apply text;
alter table updates add column if not exists apply_url text;
alter table updates add column if not exists official_website_url text;
alter table updates add column if not exists meta_description text;

create table if not exists government_schemes (
 id uuid primary key default gen_random_uuid(), title text not null, slug text not null unique,
 state text not null, state_code text, category text not null default 'General', department text,
 short_description text, description text, benefits text, eligibility text, documents text,
 application_process text, important_dates jsonb not null default '{}'::jsonb, official_url text not null,
 official_source_name text, myscheme_url text, published_date date, last_verified date default current_date,
 is_active boolean not null default true, seo_title text, seo_description text, keywords text[],
 created_at timestamptz not null default now(), updated_at timestamptz not null default now()
);
create index if not exists government_schemes_state_idx on government_schemes(state);
create index if not exists government_schemes_category_idx on government_schemes(category);
create index if not exists government_schemes_active_date_idx on government_schemes(is_active, published_date desc);
alter table government_schemes enable row level security;
drop policy if exists "public can read active government schemes" on government_schemes;
create policy "public can read active government schemes" on government_schemes for select to anon, authenticated using (is_active = true);

create index if not exists idx_updates_category on updates(category);
create index if not exists idx_updates_department on updates(department);
create index if not exists idx_updates_published_date on updates(published_date desc);
alter table updates add column if not exists search_vector tsvector generated always as (setweight(to_tsvector('english', coalesce(title,'')), 'A') || setweight(to_tsvector('english', coalesce(description,'')), 'B')) stored;
create index if not exists idx_updates_search on updates using gin(search_vector);

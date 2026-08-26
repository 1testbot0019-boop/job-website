-- Uttarakhand Jobs & Results Tracker
-- Run this once in your Supabase SQL editor (or any Postgres instance).

create extension if not exists "pgcrypto";

create table if not exists updates (
    id              uuid primary key default gen_random_uuid(),
    title           text not null,
    slug            text not null unique,
    category        text not null check (category in (
                        'JOB', 'RESULT', 'ADMIT_CARD', 'ANSWER_KEY',
                        'NOTIFICATION', 'SYLLABUS', 'PREVIOUS_PAPER'
                    )),
    department      text not null,          -- e.g. UKPSC, UKSSSC, Uttarakhand Police
    description     text,
    important_dates jsonb default '{}'::jsonb,   -- { "start": "...", "end": "...", "exam_date": "..." }
    published_date  date,
    source_url      text not null,          -- the listing page we scraped it from
    official_url    text not null,          -- the actual notice / PDF link
    pdf_url         text,
    content_hash    text not null unique,   -- sha256 of title+official_url, used for de-duplication
    is_active       boolean default true,
    created_at      timestamptz default now(),
    last_updated    timestamptz default now()
);

-- Fast filtering by category (powers /jobs, /results, /admit-card, etc.)
create index if not exists idx_updates_category on updates (category);
create index if not exists idx_updates_department on updates (department);
create index if not exists idx_updates_published_date on updates (published_date desc);

-- Full text search across title + description (powers /search)
alter table updates add column if not exists search_vector tsvector
    generated always as (
        setweight(to_tsvector('english', coalesce(title, '')), 'A') ||
        setweight(to_tsvector('english', coalesce(description, '')), 'B')
    ) stored;

create index if not exists idx_updates_search on updates using gin (search_vector);

-- Auto-update last_updated on every row change
create or replace function set_last_updated()
returns trigger as $$
begin
    new.last_updated = now();
    return new;
end;
$$ language plpgsql;

drop trigger if exists trg_set_last_updated on updates;
create trigger trg_set_last_updated
    before update on updates
    for each row execute function set_last_updated();

-- Convenience view: latest 50 updates across all categories, for the homepage
create or replace view latest_updates as
    select * from updates
    where is_active = true
    order by published_date desc nulls last, created_at desc
    limit 50;

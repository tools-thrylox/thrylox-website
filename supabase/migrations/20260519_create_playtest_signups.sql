create extension if not exists pgcrypto;

create table if not exists public.playtest_signups (
  id uuid primary key default gen_random_uuid(),
  project text not null,
  email text not null,
  source_url text,
  campaign text,
  utm_source text,
  utm_medium text,
  utm_campaign text,
  utm_content text,
  fbclid text,
  delivery_mode text not null default 'email_plus_public_fallback',
  latest_invite_url text,
  email_sent boolean not null default false,
  email_provider text,
  email_provider_message_id text,
  delivery_error text,
  consent_timestamp timestamptz not null default now(),
  first_seen_at timestamptz not null default now(),
  last_seen_at timestamptz not null default now(),
  signup_count integer not null default 1,
  raw_payload jsonb not null default '{}'::jsonb
);

create unique index if not exists playtest_signups_project_email_key
  on public.playtest_signups (project, email);

create index if not exists playtest_signups_created_at_idx
  on public.playtest_signups (first_seen_at desc);

create index if not exists playtest_signups_campaign_idx
  on public.playtest_signups (utm_campaign, campaign);

alter table public.playtest_signups enable row level security;

revoke all on public.playtest_signups from anon;
revoke all on public.playtest_signups from authenticated;

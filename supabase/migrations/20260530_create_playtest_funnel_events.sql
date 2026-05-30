create table if not exists public.playtest_funnel_events (
  id uuid primary key default gen_random_uuid(),
  project text not null,
  event_name text not null,
  event_timestamp timestamptz not null default now(),
  session_id text,
  device_id text,
  email text,
  source_url text,
  page_path text,
  referrer text,
  campaign text,
  utm_source text,
  utm_medium text,
  utm_campaign text,
  utm_content text,
  fbclid text,
  step_index integer,
  step_number integer,
  step_label text,
  event_data jsonb not null default '{}'::jsonb,
  raw_payload jsonb not null default '{}'::jsonb,
  user_agent text,
  created_at timestamptz not null default now(),
  constraint playtest_funnel_events_event_name_not_empty
    check (length(trim(event_name)) > 0)
);

create index if not exists playtest_funnel_events_timestamp_idx
  on public.playtest_funnel_events (event_timestamp desc);

create index if not exists playtest_funnel_events_name_timestamp_idx
  on public.playtest_funnel_events (project, event_name, event_timestamp desc);

create index if not exists playtest_funnel_events_session_idx
  on public.playtest_funnel_events (session_id)
  where session_id is not null;

create index if not exists playtest_funnel_events_device_idx
  on public.playtest_funnel_events (device_id)
  where device_id is not null;

create index if not exists playtest_funnel_events_email_idx
  on public.playtest_funnel_events (email)
  where email is not null;

create index if not exists playtest_funnel_events_campaign_idx
  on public.playtest_funnel_events (utm_campaign, campaign, utm_content);

alter table public.playtest_funnel_events enable row level security;

revoke all on public.playtest_funnel_events from anon;
revoke all on public.playtest_funnel_events from authenticated;

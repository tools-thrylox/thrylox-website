create table if not exists public.playtest_discord_invites (
  id uuid primary key default gen_random_uuid(),
  project text not null,
  email text not null,
  signup_id uuid references public.playtest_signups (id) on delete set null,
  invite_token text not null,
  discord_invite_url text not null,
  source_url text,
  campaign text,
  utm_source text,
  utm_medium text,
  utm_campaign text,
  utm_content text,
  fbclid text,
  email_provider_message_id text,
  first_sent_at timestamptz not null default now(),
  last_sent_at timestamptz not null default now(),
  click_count integer not null default 0,
  first_clicked_at timestamptz,
  last_clicked_at timestamptz,
  joined_at timestamptz,
  raw_payload jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint playtest_discord_invites_email_not_empty
    check (length(trim(email)) > 0),
  constraint playtest_discord_invites_token_not_empty
    check (length(trim(invite_token)) > 0)
);

create unique index if not exists playtest_discord_invites_token_key
  on public.playtest_discord_invites (invite_token);

create unique index if not exists playtest_discord_invites_project_email_key
  on public.playtest_discord_invites (project, email);

create index if not exists playtest_discord_invites_clicked_idx
  on public.playtest_discord_invites (last_clicked_at desc)
  where last_clicked_at is not null;

create index if not exists playtest_discord_invites_campaign_idx
  on public.playtest_discord_invites (utm_campaign, campaign, utm_content);

alter table public.playtest_discord_invites enable row level security;

revoke all on public.playtest_discord_invites from anon;
revoke all on public.playtest_discord_invites from authenticated;

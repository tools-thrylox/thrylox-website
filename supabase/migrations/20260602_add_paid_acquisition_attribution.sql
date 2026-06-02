alter table public.playtest_signups
  add column if not exists utm_term text,
  add column if not exists gclid text,
  add column if not exists gbraid text,
  add column if not exists wbraid text,
  add column if not exists ttclid text,
  add column if not exists platform_campaign_id text,
  add column if not exists platform_ad_group_id text,
  add column if not exists platform_ad_id text,
  add column if not exists platform_creative_id text,
  add column if not exists placement text,
  add column if not exists network text,
  add column if not exists device text;

alter table public.playtest_funnel_events
  add column if not exists utm_term text,
  add column if not exists gclid text,
  add column if not exists gbraid text,
  add column if not exists wbraid text,
  add column if not exists ttclid text,
  add column if not exists platform_campaign_id text,
  add column if not exists platform_ad_group_id text,
  add column if not exists platform_ad_id text,
  add column if not exists platform_creative_id text,
  add column if not exists placement text,
  add column if not exists network text,
  add column if not exists device text;

create index if not exists playtest_signups_paid_acquisition_idx
  on public.playtest_signups (
    utm_source,
    utm_campaign,
    platform_campaign_id,
    platform_ad_group_id,
    platform_ad_id
  );

create index if not exists playtest_funnel_events_paid_acquisition_idx
  on public.playtest_funnel_events (
    utm_source,
    utm_campaign,
    platform_campaign_id,
    platform_ad_group_id,
    platform_ad_id
  );


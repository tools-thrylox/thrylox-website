# BOG TestFlight Paid Acquisition Setup

This runbook defines the paid traffic setup for sending YouTube and TikTok users to the BOG TestFlight web onboarding.

## Goal

Create two manageable paid acquisition tracks:

- YouTube campaign in Google Ads
- TikTok campaign in TikTok Ads Manager

Primary destination:

`https://thrylox.com/onboarding.html`

Primary measurement:

1. landing step views
2. email signup
3. TestFlight link click
4. later join/play/survey signals when available

The website and Supabase remain the source of truth for captured emails and full funnel events because TestFlight public-link users can appear as anonymous in App Store Connect.

## Required Account Setup

### Google / YouTube

Create or use:

- Google Ads account: `Thrylox - BOG Playtest`
- Billing country, time zone, and currency set intentionally before campaign creation
- Linked YouTube channel containing the approved video creatives
- Google tag ID: `AW-18205284580`
- Conversion action: `BOG TestFlight signup`
- Optional secondary conversion: `BOG TestFlight link click`

Official setup references:

- Google Ads account creation: https://support.google.com/google-ads/answer/6366720
- Google Ads billing setup: https://support.google.com/google-ads/answer/9357347
- YouTube video campaigns: https://support.google.com/google-ads/answer/2375497
- ValueTrack URL parameters: https://support.google.com/google-ads/answer/6305348
- Google conversion tracking: https://developers.google.com/tag-platform/devguides/conversions

### TikTok

Create or use:

- TikTok Business Center: `Thrylox`
- TikTok ad account: `Thrylox - BOG Playtest`
- Website Pixel: `BOG Web Onboarding`
- Optimization event: `Lead`
- Secondary event: `TestFlightClick` or platform-supported custom event if configured later

Official setup references:

- TikTok ad accounts in Business Center: https://ads.tiktok.com/help/article/create-ad-accounts-in-business-center
- TikTok Pixel setup: https://ads.us.tiktok.com/help/article/get-started-pixel
- TikTok Events API setup: https://ads.us.tiktok.com/help/article/getting-started-events-api
- TikTok standard events: https://ads.tiktok.com/help/article/standard-events-parameters
- TikTok UTM parameters and macros: https://ads.us.tiktok.com/help/article/track-offsite-web-events-with-utm-parameters
- TikTok URL parameter builder: https://ads.us.tiktok.com/help/article/how-to-add-url-parameters-to-your-website-url-in-tiktok-ads-manager
- TikTok click ID: https://ads.us.tiktok.com/help/article/tiktok-click-id

## Measurement Contract

The onboarding page sends these Supabase funnel events:

- `onboarding_screen_1_viewed`
- `onboarding_screen_2_viewed`
- `onboarding_screen_3_viewed`
- `onboarding_email_screen_viewed`
- `email_submitted`
- `testflight_link_clicked`
- `device_access_reused`

Google Ads base tag is installed on the public pages. Conversion labels still need to be filled in `config.js` after Google Ads creates them:

- `googleAdsSignupConversionLabel`
- `googleAdsTestFlightClickConversionLabel`

Paid acquisition attribution parameters captured by the site:

- `utm_source`
- `utm_medium`
- `utm_campaign`
- `utm_content`
- `utm_term`
- `campaign_id`
- `ad_group_id`
- `ad_id`
- `creative_id`
- `placement`
- `network`
- `device`
- `gclid`
- `gbraid`
- `wbraid`
- `ttclid`

## Naming Rules

Use lowercase snake_case in URLs. Use readable platform object names in ad managers.

### Campaign Names

YouTube:

`BOG_TF_YT_WebSignup_Launch_202606`

TikTok:

`BOG_TF_TT_WebSignup_Launch_202606`

### Ad Group / Ad Set Names

YouTube examples:

- `YT_AG_Broad_iOS_18-34_EN`
- `YT_AG_StrategyCardGames_iOS_18-44_EN`
- `YT_AG_RoguelikeTactics_iOS_18-44_EN`

TikTok examples:

- `TT_AG_Broad_iOS_18-34_EN`
- `TT_AG_GamingInterests_iOS_18-44_EN`
- `TT_AG_StrategyRoguelike_iOS_18-44_EN`

### Creative Names

Use the same creative ID across platforms:

`BOG_CR_001_hookname_9x16_15s_EN`

Then platform ad names:

- `YT_AD_BOG_CR_001_hookname_9x16_15s_EN`
- `TT_AD_BOG_CR_001_hookname_9x16_15s_EN`

## URL Templates

### YouTube / Google Ads

Final URL:

```text
https://thrylox.com/onboarding.html
```

Final URL suffix or campaign/ad tracking parameters:

```text
utm_source=youtube&utm_medium=paid_video&utm_campaign=bog_tf_yt_websignup_launch_202606&utm_content={creative}&utm_term={targetid}&campaign_id={campaignid}&ad_group_id={adgroupid}&ad_id={creative}&creative_id={creative}&placement={placement}&network={network}&device={device}
```

Notes:

- Keep auto-tagging enabled so Google can append `gclid`, `gbraid`, or `wbraid`.
- Google does not provide a reliable campaign-name ValueTrack macro, so use `campaign_id` plus the campaign name in Google Ads.

### TikTok

Landing page URL:

```text
https://thrylox.com/onboarding.html?utm_source=tiktok&utm_medium=paid_social&utm_campaign=__CAMPAIGN_NAME__&utm_content=__CID_NAME__&utm_term=__AID_NAME__&campaign_id=__CAMPAIGN_ID__&ad_group_id=__AID__&ad_id=__CID__&creative_id=__CID__&placement=__PLACEMENT__
```

Notes:

- Enable TikTok auto tracking / TTCLID when available.
- Use TikTok's URL builder if the UI offers it, but keep the exact parameter names above.
- For upgraded Smart+ campaigns, verify macro availability before launch.

## Campaign Drafts

### YouTube Campaign

Objective:

`Leads` or `Website traffic`, only after conversion tracking is active and verified.

Initial status:

`Paused`

Recommended launch structure:

- Campaign: `BOG_TF_YT_WebSignup_Launch_202606`
- Bid strategy: `Maximize conversions`
- Conversion goal: `BOG TestFlight signup`
- Devices: mobile-first, iOS-friendly
- Locations: set after final budget/region decision
- Languages: English first unless localized creatives are available
- Frequency: keep conservative during first learning phase
- Video partners: start disabled if the goal is clean YouTube-only readout; enable later as a scale test

Ad groups:

- broad iOS gamers
- strategy/card/tactics interests
- roguelike/indie tactics interests

### TikTok Campaign

Objective:

`Website conversions`

Initial status:

`Paused`

Recommended launch structure:

- Campaign: `BOG_TF_TT_WebSignup_Launch_202606`
- Optimization event: `Lead`
- Bid strategy: lowest cost / maximum delivery for first learning phase
- Devices: iOS
- Locations: set after final budget/region decision
- Placements: TikTok first; expand to Pangle only after baseline readout

Ad groups:

- broad iOS gamers
- gaming interests
- strategy/roguelike/tactics interests

## Analysis Queries

Signup performance by platform and campaign:

```sql
select
  utm_source,
  utm_campaign,
  platform_campaign_id,
  platform_ad_group_id,
  platform_ad_id,
  count(*) as signups,
  count(*) filter (where email_sent) as emails_sent,
  min(first_seen_at) as first_signup_at,
  max(last_seen_at) as last_signup_at
from public.playtest_signups
group by 1, 2, 3, 4, 5
order by signups desc;
```

Funnel drop-off by platform:

```sql
select
  utm_source,
  utm_campaign,
  platform_campaign_id,
  platform_ad_group_id,
  platform_ad_id,
  event_name,
  count(*) as events,
  count(distinct session_id) as sessions,
  count(distinct device_id) as devices
from public.playtest_funnel_events
where created_at >= now() - interval '14 days'
group by 1, 2, 3, 4, 5, 6
order by utm_source, utm_campaign, platform_ad_group_id, platform_ad_id, events desc;
```

Creative-level TestFlight click rate:

```sql
with sessions as (
  select
    utm_source,
    utm_campaign,
    platform_ad_id,
    platform_creative_id,
    session_id,
    bool_or(event_name = 'email_submitted') as submitted_email,
    bool_or(event_name = 'testflight_link_clicked') as clicked_testflight
  from public.playtest_funnel_events
  where session_id is not null
  group by 1, 2, 3, 4, 5
)
select
  utm_source,
  utm_campaign,
  platform_ad_id,
  platform_creative_id,
  count(*) as sessions,
  count(*) filter (where submitted_email) as signup_sessions,
  count(*) filter (where clicked_testflight) as testflight_click_sessions,
  round(
    100.0 * count(*) filter (where submitted_email) / nullif(count(*), 0),
    2
  ) as signup_rate_pct,
  round(
    100.0 * count(*) filter (where clicked_testflight) / nullif(count(*), 0),
    2
  ) as testflight_click_rate_pct
from sessions
group by 1, 2, 3, 4
order by signup_sessions desc;
```

## Launch Gate

Do not switch campaigns from paused to live until:

- billing country, time zone, currency, and payment method are confirmed by the owner
- creatives are uploaded and named with stable creative IDs
- UTM preview URLs are tested in browser
- Supabase records a test visit with platform parameters
- conversion tag / pixel test event is visible in each platform
- daily budgets and hard stop date are confirmed
- privacy/consent requirements are accepted for the target regions

## Owner Inputs Needed

These values must be confirmed before live launch:

- daily budget per platform
- total test budget
- target countries
- campaign start date
- campaign stop date
- approved creative filenames and creative IDs
- Google login / account owner
- TikTok Business Center owner
- billing country and currency
- whether campaigns should launch paused or live after creation

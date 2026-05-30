# Phase 1 Public-Link Signup Flow

## Goal

Ship a reliable production signup flow now, without waiting for App Store Connect API approval:

1. capture the tester email on `thrylox.com`
2. save the signup in our own database
3. send our own email containing the public TestFlight link
4. show the same TestFlight link on-screen immediately
5. fall back gracefully if email delivery fails

## Player-facing flow

1. Player opens `thrylox.com/onboarding.html`
2. Player enters email
3. Frontend posts to `signupEndpoint`
4. Backend saves the signup in Supabase
5. Backend attempts transactional delivery through Resend
6. Frontend always opens the success state:
   - if email sent: `Check your email` + `Open TestFlight now`
   - if email failed: `Access ready` + `Continue to TestFlight`

## Why this phase exists

This phase does **not** solve Apple-side named tester attribution. Anyone who ultimately accepts the public TestFlight link may still appear as `Anonymous` in App Store Connect.

That is acceptable for now because our own database becomes the source of truth for:

- email
- first seen timestamp
- source URL
- campaign context
- delivery result
- onboarding funnel events

## Services

- **Frontend**: GitHub Pages site on `thrylox.com`
- **Database**: Supabase Postgres
- **Backend endpoint**: Supabase Edge Function
- **Email delivery**: Resend

## Required environment variables

- `SUPABASE_URL`
- `SUPABASE_SECRET_KEY`
- `RESEND_API_KEY`
- `RESEND_FROM_EMAIL`
- `RESEND_FROM_NAME`
- `RESEND_REPLY_TO`
- `PUBLIC_TESTFLIGHT_LINK`
- `SUPPORT_EMAIL`
- `ALLOWED_ORIGIN`

## Database table

The migration in `supabase/migrations/20260519_create_playtest_signups.sql` creates a `playtest_signups` table with:

- email and project identity
- source/campaign fields
- `utm_content` support for conference QR variants and banner placements
- signup counters
- latest invite URL
- delivery status and provider response
- raw payload archive

The migration in `supabase/migrations/20260530_create_playtest_funnel_events.sql` creates a separate `playtest_funnel_events` event log. This keeps `playtest_signups` clean and deduped while preserving the full funnel:

- `onboarding_screen_1_viewed`
- `onboarding_screen_2_viewed`
- `onboarding_screen_3_viewed`
- `onboarding_email_screen_viewed`
- `email_submitted`
- `email_sent` or `email_delivery_failed`
- `testflight_link_clicked`

The migration in `supabase/migrations/20260530203000_create_playtest_discord_invites.sql` creates `playtest_discord_invites` for Discord attribution. The email uses a server-side tokenized redirect instead of putting the tester email in the URL:

- email is stored against `invite_token`
- the email CTA opens the Edge Function with `action=discord&token=...`
- the Edge Function increments `click_count`, stores `first_clicked_at` / `last_clicked_at`, and redirects to Discord
- `joined_at` is reserved for a future Discord bot or OAuth flow; a plain Discord invite can only prove a click, not a completed join

Useful funnel check:

```sql
select
  event_name,
  utm_source,
  utm_campaign,
  utm_content,
  count(*) as events,
  count(distinct session_id) as sessions,
  count(distinct device_id) as devices
from public.playtest_funnel_events
where project = 'BOG'
group by event_name, utm_source, utm_campaign, utm_content
order by min(event_timestamp);
```

## Deployment steps

### 1. Create Supabase project

- Create a new project in Supabase
- Save the project URL
- Save the server-side secret key

### 2. Create table

- Open the SQL editor in Supabase
- Run `supabase/migrations/20260519_create_playtest_signups.sql`

### 3. Create Resend account

- Verify the sending domain, ideally `thrylox.com`
- Create a sender address such as `playtest@thrylox.com`
- Create an API key

### 4. Deploy edge function

- Create a new edge function named `testflight-signup`
- Paste the code from `supabase/functions/testflight-signup/index.ts`
- Add the environment variables above
- Disable JWT verification for this function so the website can invoke it as a public signup endpoint

### 4a. Recommended values for this project

- `SUPABASE_URL=https://hvmucdlsmqclxcuqsatg.supabase.co`
- `PUBLIC_TESTFLIGHT_LINK=https://testflight.apple.com/join/g2C5saQ4`
- `ALLOWED_ORIGIN=https://thrylox.com`
- `SUPPORT_EMAIL=raigred@thrylox.com`
- `RESEND_FROM_EMAIL=raigred@thrylox.com`
- `RESEND_FROM_NAME=Maks @ Thrylox`
- `RESEND_REPLY_TO=raigred@thrylox.com`

### 5. Wire the site

- Set `signupEndpoint` in `config.js` to the edge function URL
- Keep `publicTestFlightLink` as the fallback and immediate success CTA

## Notes

- This phase intentionally prefers resilient UX over perfect attribution.
- Repeat submits from the same email update the existing row instead of creating duplicate testers.
- The same browser/device re-uses the existing TestFlight path in the frontend instead of sending another email again.
- Incognito or cleared browser storage can bypass device memory, so the guaranteed server-side protection in Phase 1 is still email-based dedupe.
- Once App Store Connect API access is approved, the backend can evolve to:
  - create named beta testers
  - trigger Apple-side invites
  - still keep the public link as fallback

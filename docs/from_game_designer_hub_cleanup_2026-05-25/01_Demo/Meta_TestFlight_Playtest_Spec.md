# Meta to TestFlight Playtest Spec

## Goal
Run an investor-facing BOG validation funnel that measures:
- which external promise attracts qualified mobile strategy players
- whether those players install and play the TestFlight build
- whether the BOG duel loop and broader career fantasy still feel compelling in an unfinished demo

## Player Value
Players get early access to a distinctive mobile sci-fi strategy game where they act as Resolvers, solve sanctioned conflicts through AR figurine duels, and test a build that already expresses BOG’s core strategic identity.

## Trigger / Entry Point
Use this playtest when the team needs:
- a real paid-interest signal from midcore mobile strategy players
- a cleaner bridge from ad promise to actual build behavior
- review-friendly investor evidence that goes beyond “people said it looked cool”

## UX Flow
1. A player sees one BOG-specific ad angle.
2. The ad opens a cohort-specific landing page URL.
3. The landing page explains the promise, build state, session commitment, and iPhone requirement.
4. The player submits a short signup form and receives a unique `tester_code`.
5. The player opens the matching TestFlight invite.
6. The player installs and plays the build.
7. The build logs structured BOG playtest telemetry through PlayFab.
8. The player completes a short post-session survey.
9. The team joins ad, landing, TestFlight, telemetry, and survey data into one reporting layer.

## Rules
- Keep each cohort tied to one specific BOG promise.
- Do not mix too many messages inside a single creative.
- Do not pitch features that the demo cannot emotionally support.
- Keep the signup flow short enough that it measures interest in BOG, not patience for forms.
- Treat `would play again` and `would be disappointed if unreleased` as directional product signals, not true retention.

## Rewards / Economy Impact
- No monetization, store flow, or live-ops claim is required for this test.
- External tester incentives, if used, should not distort in-game progression.

## Risks
- The current demo only partially represents the final game, so creative promise and build reality can drift.
- Public-link TestFlight flow can lose tester identity unless we capture and carry a `tester_code`.
- If the player does not understand the 12-danger lineup rule, they may miss BOG’s main differentiator.
- If the current build overindexes on the guided first mission, players may not reach the higher-value “this could grow” impression.

## Dependencies
- TestFlight external groups
- Meta business assets and ad account
- hosted landing page
- signup and survey endpoints
- PlayFab event access
- in-game `tester_code` entry or attribution strategy

## Open Questions
- Which three BOG angles should be tested first
- Which gameplay stills or clips can be exported cleanly from Unreal for the landing and ads
- Whether the demo should ask for `tester_code` explicitly or infer it via deep-link or backend mapping

## Implementation Notes
### Recommended cohort angles
- `resolver_fantasy`
  - Position BOG as a future-era contract strategy game where players settle sanctioned disputes through AR duel protocol.
- `strategic_duel`
  - Position BOG around draft, constrained lineup assembly, 12 danger, and readable autobattle outcome.
- `anomaly_run`
  - Position BOG around the longer-form PvE challenge: 5 encounters, fatigue pressure, and Joker choices between wins.

### Recommended campaign objective
- Start with `Traffic` or `Leads` to the hosted landing page rather than app-install optimization.
- The immediate job is qualified interest plus playtest conversion, not production CPI benchmarking.

### Landing page requirements
- One strong BOG hook above the fold
- One concise explanation of what makes the duel system different
- One clear build-state disclosure
- One short signup form
- One obvious TestFlight CTA

### Required signup fields
- email
- iPhone model
- genre familiarity
- 15-20 minute session commitment
- Discord handle optional

### Required cohort metadata
- `cohort`
- `campaign_id`
- `adset_id`
- `creative_id`
- `fbclid`
- `tester_code`

### Investor-facing KPIs
- `CTR` by BOG promise
- landing visitor to signup conversion
- signup to TestFlight click-through
- TestFlight accepted / installed by cohort
- first open
- onboarding completion
- first full lineup completion
- first core loop completion
- median session length
- survey completion rate
- `% would play a polished version again`
- `% moderately or very disappointed if never released`

### Required BOG gameplay telemetry events
- `playtest.first_open`
- `playtest.onboarding_started`
- `playtest.onboarding_completed`
- `playtest.core_loop_started`
- `playtest.core_loop_completed`
- `playtest.session_ended`
- `playtest.survey_opened`
- `playtest.survey_completed`

### BOG-specific telemetry fields
- `tester_code`
- `playtest_cohort`
- `campaign_id`
- `creative_id`
- `build_channel`
- `build_version`
- `entry_point`
- `loop_name`
- `exit_reason`

### Success criteria
- At least one cohort produces strong qualified signup intent.
- A meaningful share of signups convert into TestFlight installs.
- A meaningful share of installers complete the early BOG loop and understand the core system.
- The strongest player quotes describe BOG’s distinctive strategy structure or career fantasy, not only its art direction.

## QA / Playtest Checks
- Verify each ad links to the correct cohort URL.
- Verify the landing page records cohort and `tester_code`.
- Verify the correct TestFlight group opens from that cohort.
- Verify `playtest.first_open` and `playtest.core_loop_completed` appear in PlayFab before spend is scaled.
- Verify survey submissions preserve cohort and tester identity.

# Meta to TestFlight Launch Runbook

## Goal
Provide the full operational path for launching the BOG paid playtest funnel from preparation through investor readout.

## Player Value
Players should experience a coherent journey from ad promise to real BOG gameplay without feeling bait-and-switched by missing context or broken expectations.

## Trigger / Entry Point
Use this runbook when the team is ready to move from planning into a real external test wave.

## UX Flow
1. Prepare assets and access.
2. Publish the landing stack.
3. Configure TestFlight groups.
4. Wire telemetry and survey tracking.
5. Create and review Meta campaigns.
6. Run internal dry-run QA.
7. Launch with a limited budget ramp.
8. Monitor, debug, and summarize results.

## Rules
- No campaign goes live before a complete end-to-end dry run.
- No major build change ships after launch without incrementing build version and noting the split in reporting.
- Keep one owner per system during launch day:
  - Meta
  - landing/backend
  - TestFlight
  - gameplay telemetry
  - investor reporting

## Rewards / Economy Impact
- Avoid changing reward tuning during the paid test unless the build is clearly broken.
- If reward tuning changes are required, restart or clearly segment the test wave.

## Risks
- Broken links or missing TestFlight approvals can waste paid traffic immediately.
- If Meta tracking is only pixel-side and no server-side event path exists, reporting will be fragile.
- If build version changes mid-wave without cohort discipline, analysis quality will collapse.

## Dependencies
- access checklist completion
- approved assets
- approved landing copy
- approved survey
- approved build in TestFlight

## Open Questions
- Whether to use a single country or a small country cluster for the first wave
- Whether to gate by genre-heavy audiences only or include broader sci-fi strategy reach

## Implementation Notes
### Phase 1: Access and ownership
- Confirm Meta business ownership and ad account billing.
- Confirm App Store Connect roles and API key ownership.
- Confirm landing host and secret storage owner.
- Confirm PlayFab dashboard access and query owner.

### Phase 2: Asset pack
- Export 3 cohort-specific ad concepts.
- Export 4-6 real game stills for the landing page.
- Export 1 short gameplay clip for the hero section if available.
- Approve copy for:
  - ads
  - landing
  - signup confirmation
  - survey

### Phase 3: Landing and backend
- Deploy static landing assets.
- Configure `config.js` with:
  - project name
  - BOG-specific hook
  - cohort TestFlight links
  - signup endpoint
  - survey endpoint
  - support channel
- Implement signup persistence with dedupe by email plus timestamp.
- Generate a unique `tester_code` on signup and store it with cohort metadata.
- Implement Meta Pixel and server-side Conversions API events for:
  - landing view
  - qualified signup
  - TestFlight CTA click
  - survey completion

### Phase 4: TestFlight
- Create one external group per cohort.
- Add the same build to each cohort group unless testing build variants.
- Enable public link or email invite flow depending on attribution approach.
- Confirm beta app review information is complete.
- Confirm public-link criteria if device filtering is needed.

### Phase 5: Build instrumentation
- Ensure the build can log all required playtest events.
- Ensure BOG telemetry includes:
  - `tester_code`
  - `playtest_cohort`
  - `campaign_id`
  - `creative_id`
- If direct deep-link attribution is not possible, add a simple first-run tester-code entry or confirmation step.

### Phase 6: Meta campaign build
- Create campaign with website destination to the landing page.
- Create one ad set per cohort if budget permits.
- Create one ad per creative concept with matching URL parameters.
- Validate:
  - pixel firing
  - server events arriving
  - URL params preserved
  - landing conversion event recorded

### Phase 7: Dry-run QA
- One internal tester clicks ad preview URL.
- Completes signup.
- Opens TestFlight.
- Installs build.
- Plays one session.
- Submits survey.
- Team verifies that every system recorded the tester correctly.

### Phase 8: Launch
- Start with limited daily spend.
- Check first traffic within 1 hour.
- Confirm:
  - no broken destination URLs
  - no signup failures
  - no TestFlight cohort mismatch
  - PlayFab events arriving
- Only then scale toward the planned budget.

### Phase 9: Analysis
- Pull daily Meta insights.
- Pull signup table by cohort.
- Pull TestFlight acceptance and install status.
- Pull PlayFab event aggregates.
- Pull survey completion and top quotes.
- Update the investor evidence template.

## QA / Playtest Checks
- Every launched URL must be tested on-device.
- Every cohort must have its own landing params and TestFlight destination.
- The team must verify that at least one real test record can be traced end to end.

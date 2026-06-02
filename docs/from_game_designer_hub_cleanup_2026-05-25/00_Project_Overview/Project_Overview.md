# Project Overview

## Goal
Provide a single review-ready overview of the current BOG validation plan, grounded in the actual game vision and demo structure rather than generic mobile playtest language.

## Player Value
BOG should make players feel like future-era Resolvers who settle meaningful conflicts through sanctioned AR figurine duels, build constrained lineups with strong judgment, and grow from local contracts into wider planetary stakes.

## Trigger / Entry Point
Use this overview when:
- onboarding teammates into the current BOG product direction
- aligning design, engineering, and marketing around the next external playtest wave
- preparing an investor-facing evidence pack from the demo

## UX Flow
1. A player sees a Meta ad built around one specific BOG promise.
2. The player lands on a BOG-specific signup page that frames the TestFlight wave as an early Resolver trial.
3. The player joins a cohort-specific TestFlight group.
4. The player plays the demo and encounters the real BOG loop:
   contract or duel entry, strategic setup, 12-danger lineup completion, autobattle result, rewards, and return to hub.
5. The player completes a short survey that separates rough-build friction from actual product appeal.
6. The team combines acquisition data, TestFlight status, PlayFab telemetry, and player feedback into an investor-ready narrative.

## Rules
- Treat the test as `prototype validation`, not proof of production retention.
- All external copy should reflect BOG’s true identity:
  - mobile sci-fi strategy
  - AR figurine duels
  - Resolver fantasy
  - 12-danger constrained lineup building
  - PvP and Anomaly progression
- Keep every cohort tied to one clear promise so creative learning is actionable.
- Optimize for engineer review and stakeholder clarity before launch speed.

## Rewards / Economy Impact
- The validation funnel should not depend on monetization, store UX, or live economy conversion.
- External tester incentives, if used, should remain outside the in-game economy.

## Risks
- The product vision is stronger than the current demo breadth, so poor framing can cause players to judge missing systems instead of the core promise.
- If the lineup logic, danger budget, or result readability are unclear, the player may not understand what makes BOG different.
- If the landing page overpromises full live PvP or full metagame depth, the playtest can damage trust instead of building investor confidence.

## Dependencies
- BOG design docs in `/Users/raigred/Work/Thrylox/_workspace/bog_design/Docs`
- TestFlight external testing setup
- Meta campaign infrastructure
- Landing host plus signup/survey backend
- PlayFab telemetry access

## Open Questions
- Which BOG promise should lead the first paid test:
  - Resolver career fantasy
  - strategic 12-danger duel loop
  - Anomaly PvE run escalation
- Which exported gameplay stills or captured device footage best express the real game
- Whether the current build can surface `tester_code` inside the first session without adding friction

## Implementation Notes
- The main BOG-based funnel spec lives in [Meta_TestFlight_Playtest_Spec.md](/Users/raigred/Work/Thrylox/_workspace/game_designer_hub/Docs/01_Demo/Meta_TestFlight_Playtest_Spec.md).
- End-to-end launch operations live in [Meta_TestFlight_Launch_Runbook.md](/Users/raigred/Work/Thrylox/_workspace/game_designer_hub/Docs/01_Demo/Meta_TestFlight_Launch_Runbook.md).
- Required access and ownership mapping lives in [Access_And_Operations_Checklist.md](/Users/raigred/Work/Thrylox/_workspace/game_designer_hub/Docs/01_Demo/Access_And_Operations_Checklist.md).
- Survey copy lives in [Post_Session_Survey.md](/Users/raigred/Work/Thrylox/_workspace/game_designer_hub/Docs/12_Playtest_Notes/Post_Session_Survey.md).
- Static landing assets live in [Marketing/TestFlightPlaytest](/Users/raigred/Work/Thrylox/_workspace/game_designer_hub/Marketing/TestFlightPlaytest).

## QA / Playtest Checks
- Confirm all public-facing copy matches actual BOG systems and demo scope.
- Confirm each creative routes to the intended cohort-specific landing URL and TestFlight group.
- Confirm the build can log playtest events with cohort context.
- Confirm the survey asks about BOG’s real differentiated promise, not only generic enjoyment.

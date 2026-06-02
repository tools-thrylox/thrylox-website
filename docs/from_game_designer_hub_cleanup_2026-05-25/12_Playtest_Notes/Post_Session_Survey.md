# Post-Session Survey

## Goal
Capture whether players understood and cared about BOG’s real differentiated promise after a first TestFlight session.

## Player Value
Players get a fast feedback path that lets them react to the actual BOG loop without writing a long report.

## Trigger / Entry Point
Show or send this survey immediately after:
- the first completed meaningful duel loop
- the first serious stop point if a player exits early
- a full Anomaly run if the player reaches it

## UX Flow
1. Player finishes or exits a focused session.
2. Player sees a short CTA inviting feedback.
3. Survey opens with cohort and tester identity already attached if possible.
4. Team receives both scaled answers and specific BOG friction notes.

## Rules
- Keep the survey under 3 minutes.
- Optimize for product signal, not bug QA.
- Ask about BOG’s core loop and fantasy, not only generic fun.
- Use Discord or email only as backup delivery, not the primary path.

## Rewards / Economy Impact
- None required.
- If completion incentives exist, they should be external.

## Risks
- If the survey happens too late, responses become vague.
- If questions are too generic, investors will not learn why BOG is distinctive or weak.

## Dependencies
- hosted survey page or external form
- a reachable survey link inside the build or from a follow-up message

## Open Questions
- Which exact in-build moment should open the survey CTA
- Whether to ask for interview follow-up in the same form

## Implementation Notes
### Recommended survey copy

1. `How enjoyable was your experience overall?`
   - scale `1-5`

2. `How clear was the main BOG loop: build a lineup, reach 12 danger, commit, and watch the result?`
   - scale `1-5`

3. `When did the game start to feel interesting?`
   - It never became interesting
   - In the first minute
   - Within the first 5 minutes
   - After 5+ minutes

4. `What was the most interesting part of the experience?`
   - short text

5. `What was the most confusing or frustrating part?`
   - short text

6. `How appealing was the Resolver / sci-fi contract fantasy?`
   - scale `1-5`

7. `If this game were more polished, how likely would you be to play it again?`
   - scale `1-5`

8. `How disappointed would you be if this game never released?`
   - Not disappointed
   - Slightly disappointed
   - Moderately disappointed
   - Very disappointed

### Delivery recommendation
- Primary: hosted survey page opened from the build or a post-session screen
- Backup: Discord follow-up with the same link
- Avoid relying on email alone for first-wave response rate

### Data to capture with each response
- cohort
- tester code or email
- submission timestamp
- build version if known
- free-text sentiment

## QA / Playtest Checks
- Test the survey on iPhone Safari.
- Confirm cohort and tester identity survive into the response row.
- Confirm the wording reflects real BOG systems.

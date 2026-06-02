# Access and Operations Checklist

## Goal
List every access, secret, permission, and external dependency required for Codex or the team to run the BOG playtest funnel end to end.

## Player Value
Indirect only. This protects players from broken flows and protects the team from launch-day confusion.

## Trigger / Entry Point
Use before any attempt to automate campaign creation, signup storage, TestFlight enrollment, or reporting.

## UX Flow
1. Confirm system owner.
2. Confirm access exists.
3. Confirm secret delivery method.
4. Confirm review requirement.
5. Mark ready for launch.

## Rules
- Never share personal login credentials.
- Prefer role-based access, service accounts, API keys, and scoped tokens.
- Record who owns revocation for every key.
- Any token used for automation must have the minimum permissions necessary.

## Rewards / Economy Impact
- None.

## Risks
- Missing one permission can block the entire funnel at launch time.
- Over-broad tokens create avoidable security risk.

## Dependencies
- Meta business assets
- App Store Connect
- hosting/backend
- PlayFab

## Open Questions
- Whether the team wants Codex to only prepare scripts or also execute live campaign and API operations
- Which secret manager or delivery path is acceptable for tokens

## Implementation Notes
### Meta access
- Business portfolio access
- Ad account admin access
- Billing method already set
- Page access
- Instagram account access if used in placements
- Pixel or dataset admin access
- Events Manager access
- Developer app with Marketing API product
- Access token path:
  - app id
  - app secret
  - long-lived user or system-user token
- Review note:
  - campaign launch should still be manually approved before going live

### App Store Connect access
- Account role:
  - `Admin` or `App Manager`
- TestFlight group management access
- Ability to edit external testing details
- App Store Connect API key if automation is desired
- Review note:
  - first external build approval may still need manual handling in App Store Connect

### Hosting and backend access
- static site host
- deploy token or CI access
- domain or subdomain management
- TLS already handled by host
- secret storage for:
  - Meta Conversions API token
  - App Store Connect private key
  - signup backend secrets

### PlayFab access
- title access for reading telemetry
- event dashboard or export path
- owner who can validate incoming playtest events

### Game/build access
- latest approved iOS TestFlight build number
- release notes and beta app review text
- visual export pack:
  - screenshots
  - short clips
  - logo or wordmark

### Needed from the team before full automation
- approved BOG messaging by cohort
- approved spend ceiling
- country / locale targeting decision
- success metric definitions
- go/no-go launch reviewer

## QA / Playtest Checks
- Verify each access is granted to the correct role, not to a shared password.
- Verify API keys are testable before launch week.
- Verify one internal dry-run can complete using only the granted access set.

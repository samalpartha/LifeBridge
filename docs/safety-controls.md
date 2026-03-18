# Safety and Abuse Controls

## Verification Tiers

- **Tier A / Official**: trusted institutional sources
- **Tier B / Verified**: admin-reviewed updates
- **Tier C / Community**: crowd signals (should be verified before escalation)

## Implemented Controls

- Rate limiting on mutation-heavy endpoints:
  - haven creation/updates
  - check-ins
  - beacon creation/updates
  - help requests/offers
  - agent query calls
- Idempotent check-in guard to reduce duplicate signal noise.
- Structured trace logging for all copilot recommendations.
- Explicit risk language in route guidance (no absolute safety guarantees).

## Recommended Next Controls

- Admin moderation queue for community haven updates.
- Evidence URL validation and signed upload workflow.
- Geo-anomaly detection for suspicious mass location edits.
- Reputation-based throttling by actor identity.
- PII minimization and retention windows for reunification data.

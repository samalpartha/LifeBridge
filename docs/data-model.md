# Data Model

## Core Crisis Tables

### `safety_havens`

- `id`
- `name`
- `type`
- `lat`, `lon`
- `address`
- `services`
- `hours`
- `intake_rules`
- `capacity_status`
- `last_verified_at`
- `verification_tier`

### `haven_updates`

- `id`
- `haven_id`
- `status`
- `note`
- `reporter_role`
- `evidence_url`
- `created_at`

### `checkins`

- `id`
- `user_code`
- `lat`, `lon`
- `status`
- `battery_level`
- `message`
- `created_at`

### `help_requests`

- `id`
- `requester_code`
- `category`
- `details`
- `lat`, `lon`
- `urgency`
- `created_at`
- `fulfilled_at`

### `help_offers`

- `id`
- `offerer_code`
- `category`
- `details`
- `seats`
- `radius_km`
- `lat`, `lon`
- `created_at`
- `valid_until`

### `reunification_beacons`

- `id`
- `beacon_code`
- `family_name_hint`
- `lat`, `lon`
- `status`
- `message`
- `created_at`
- `last_updated_at`

### `agent_traces`

- `id`
- `trace_id`
- `agent_name`
- `query`
- `response`
- `tool_calls`
- `sources_used`
- `confidence_score`
- `duration_ms`
- `created_at`

## Model Location

SQLAlchemy implementations are in `apps/api/app/db/crisis_models.py`.

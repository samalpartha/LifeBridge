#!/usr/bin/env bash
set -euo pipefail

BASE_URL="${BASE_URL:-http://localhost:8000}"

echo "[e2e] waiting for API health..."
for _ in {1..20}; do
  if curl -fsS "${BASE_URL}/health" >/dev/null; then
    break
  fi
  sleep 2
done

curl -fsS "${BASE_URL}/health" >/dev/null

echo "[e2e] creating haven..."
HAVEN_ID="$(curl -fsS -X POST "${BASE_URL}/crisis/havens" \
  -H "Content-Type: application/json" \
  -d '{"name":"Smoke Shelter","type":"shelter","lat":35.0,"lon":36.0,"address":"Smoke Street","services":["food","water"],"hours":"24/7","intake_rules":"Open"}' \
  | python3 -c 'import json,sys; print(json.load(sys.stdin)["id"])')"

echo "[e2e] searching havens..."
curl -fsS "${BASE_URL}/crisis/havens/search?lat=35.0&lon=36.0&radius_km=10" >/dev/null

echo "[e2e] generating routes..."
curl -fsS -X POST "${BASE_URL}/crisis/routes/generate" \
  -H "Content-Type: application/json" \
  -d '{"start_lat":35.0,"start_lon":36.0,"end_lat":35.01,"end_lon":36.01,"mode":"walking","time_of_day":"day","user_constraints":[]}' >/dev/null

echo "[e2e] check-in..."
curl -fsS -X POST "${BASE_URL}/crisis/checkins" \
  -H "Content-Type: application/json" \
  -d '{"user_code":"smoke-user","lat":35.0,"lon":36.0,"status":"safe","battery_level":80,"message":"smoke checkin"}' >/dev/null

echo "[e2e] beacon..."
curl -fsS -X POST "${BASE_URL}/crisis/beacons" \
  -H "Content-Type: application/json" \
  -d '{"beacon_code":"SMOKE123","family_name_hint":"SM","lat":35.0,"lon":36.0,"status":"safe","message":"smoke"}' >/dev/null || true

echo "[e2e] help request + offer..."
curl -fsS -X POST "${BASE_URL}/crisis/help/requests" \
  -H "Content-Type: application/json" \
  -d '{"requester_code":"smoke-req","category":"transport","details":"need pickup","lat":35.0,"lon":36.0,"urgency":"high"}' >/dev/null

curl -fsS -X POST "${BASE_URL}/crisis/help/offers" \
  -H "Content-Type: application/json" \
  -d '{"offerer_code":"smoke-off","category":"transport","details":"2 seats","seats":2,"radius_km":20,"lat":35.0,"lon":36.0}' >/dev/null

echo "[e2e] copilot + trace..."
TRACE_ID="$(curl -fsS -X POST "${BASE_URL}/crisis/agent/query" \
  -H "Content-Type: application/json" \
  -d '{"query":"Need a safe route with child and no car","context":{"lat":35.0,"lon":36.0}}' \
  | python3 -c 'import json,sys; print(json.load(sys.stdin)["trace_id"])')"

curl -fsS "${BASE_URL}/crisis/traces/${TRACE_ID}" >/dev/null

echo "[e2e] smoke flow complete (haven ${HAVEN_ID}, trace ${TRACE_ID})"

# Gradient AI Implementation

This document describes the implemented Gradient AI architecture in LifeBridge Crisis Corridor.

## Runtime Strategy

Configured in `apps/api/app/core/config.py`:

- `GRADIENT_RUNTIME_MODE=mock` -> deterministic local orchestration
- `GRADIENT_RUNTIME_MODE=live` -> requires valid Gradient credentials
- `GRADIENT_RUNTIME_MODE=auto` -> tries live, falls back to mock

Runtime status endpoint:

- `GET /crisis/runtime`
- `GET /crisis/runtime/live-check`

## Multi-Agent Orchestration

Implemented in `apps/api/app/services/gradient_ai.py`.

The orchestrator composes five role-focused agents:

- `SafetyGuardianAgent`
- `HavenIntelAgent`
- `RouteRiskAgent`
- `ReunificationAgent`
- `AidMatchingAgent`

In mock mode, these agents execute deterministic logic using crisis DB data and route scoring.
In live mode, DigitalOcean Gradient answer generation is executed against a live RAG collection and then combined with operational multi-agent outputs.

## Knowledge Base

Knowledge content source:

- `apps/api/app/services/crisis_kb_content.py`

Document groups:

- Crisis FAQs
- Haven verification playbook
- Crisis safety protocols

Live SDK usage:

- `Gradient.create_rag_collection(...)`
- `Gradient.list_rag_collections()`
- `Gradient.get_rag_collection(id_=...)`
- `Gradient.answer(question=..., source={"type":"rag","collection_id":...})`

Reindex helper script:

- `python scripts/reindex_kb.py`

## Agent Query + Traceability

Main endpoint:

- `POST /crisis/agent/query`

Each call persists:

- query
- response
- tool calls
- sources used
- confidence score
- duration
- trace id

Trace endpoints:

- `GET /crisis/traces`
- `GET /crisis/traces/{trace_id}`

## Evaluation Harness

Scenarios and scoring:

- `apps/api/app/services/evaluations.py`

Run script:

- `python scripts/run_evals.py`

The script sends each scenario to `/crisis/agent/query`, scores response quality, and writes:

- `docs/eval_results.json`

## Notes for Live Demo

- Set `GRADIENT_RUNTIME_MODE=live`.
- Set both `GRADIENT_ACCESS_TOKEN` and `GRADIENT_WORKSPACE_ID`.
- Use `/crisis/runtime/live-check` to prove live connectivity before recording.

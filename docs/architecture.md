# Architecture

## System Overview

```mermaid
flowchart LR
  U[Displaced Civilian] --> W[Next.js Crisis UI]
  W -->|REST| A[FastAPI Crisis API]
  A --> P[(PostgreSQL)]
  A --> M[(MinIO / Object Store)]
  A --> O[RescueOps Orchestrator]

  subgraph O[Gradient/Hybrid Agent Layer]
    SG[SafetyGuardianAgent]
    HI[HavenIntelAgent]
    RR[RouteRiskAgent]
    RE[ReunificationAgent]
    AM[AidMatchingAgent]
  end

  O --> KB[(Crisis Knowledge Base)]
  O --> T[(AgentTrace Logs)]
  A --> T
```

## Runtime Model

- `mock`: deterministic local orchestration, always available
- `live`: uses DigitalOcean Gradient credentials and live agent execution
- `auto`: tries live and falls back to mock if unavailable

## Primary User Journey

1. User opens crisis console and grants location.
2. HavenIntel returns nearby verified havens.
3. RouteRisk returns 3 route options with reasons.
4. User check-ins and can create reunification beacon.
5. Help requests/offers are matched by proximity and category.
6. Copilot call logs traces with tools, sources, confidence, duration.

#!/usr/bin/env python3
"""Reindex or refresh Gradient KB documents."""

from __future__ import annotations

import asyncio
import sys
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
sys.path.append(str(ROOT / "apps" / "api"))


async def run() -> int:
    try:
        from app.services.gradient_ai import gradient_service  # noqa: E402
    except Exception as exc:  # pragma: no cover - import/runtime dependent
        print("Failed to initialize Gradient runtime:", exc)
        print("Set GRADIENT_ACCESS_TOKEN and GRADIENT_WORKSPACE_ID for live mode.")
        return 1

    await gradient_service.bootstrap()
    status = gradient_service.get_runtime_status()

    print("Runtime:", status["active_mode"])
    print("Configured mode:", status["configured_mode"])
    if status.get("active_mode") != "live":
        print("Live Gradient runtime unavailable. Reindex skipped.")
        return 1

    result = await gradient_service.refresh_live_knowledge_base()
    print(
        f"Reindexed {result['files_added']} document file(s) "
        f"into KB {result['knowledge_base_id']}"
    )
    return 0 if result["status"] == "ok" else 1


if __name__ == "__main__":
    raise SystemExit(asyncio.run(run()))

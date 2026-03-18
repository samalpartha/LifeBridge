#!/usr/bin/env python3
"""Run the crisis eval suite against a live API instance."""

import argparse
import datetime as dt
import json
import re
import sys
import urllib.error
import urllib.request
from pathlib import Path
from typing import Any

ROOT = Path(__file__).resolve().parents[1]
sys.path.append(str(ROOT / "apps" / "api"))

from app.services.evaluations import CRISIS_EVAL_SCENARIOS, score_agent_response  # noqa: E402


_THINK_BLOCK = re.compile(r"<think>.*?</think>\s*", re.IGNORECASE | re.DOTALL)


def _post_json(url: str, payload: dict[str, Any]) -> tuple[int, dict[str, Any] | str]:
    request = urllib.request.Request(
        url=url,
        data=json.dumps(payload).encode("utf-8"),
        headers={"Content-Type": "application/json"},
        method="POST",
    )
    try:
        with urllib.request.urlopen(request, timeout=45) as response:
            body = response.read().decode("utf-8")
            return response.status, json.loads(body)
    except urllib.error.HTTPError as exc:
        return exc.code, exc.read().decode("utf-8")
    except Exception as exc:  # pragma: no cover - network/runtime dependent
        return 599, str(exc)


def run_suite(base_url: str) -> dict[str, Any]:
    rows: list[dict[str, Any]] = []
    for scenario in CRISIS_EVAL_SCENARIOS:
        status, payload_or_error = _post_json(
            f"{base_url}/crisis/agent/query",
            {
                "query": scenario["query"],
                "context": scenario["context"],
            },
        )
        if status != 200 or not isinstance(payload_or_error, dict):
            rows.append(
                {
                    "id": scenario["id"],
                    "name": scenario["name"],
                    "status": "failed",
                    "error": f"HTTP {status}: {payload_or_error}",
                }
            )
            continue

        payload = payload_or_error
        response_text = str(payload.get("response", ""))
        sanitized_response = _THINK_BLOCK.sub("", response_text).strip()
        contains_private_reasoning = sanitized_response != response_text.strip()
        score = score_agent_response(
            query=scenario["query"],
            response=sanitized_response or response_text,
            expected_constraints=scenario["expected_constraints"],
            expected_behaviors=scenario["expected_behaviors"],
        )
        rows.append(
            {
                "id": scenario["id"],
                "name": scenario["name"],
                "status": "ok",
                "trace_id": payload.get("trace_id"),
                "mode": payload.get("mode"),
                "source_count": len(payload.get("sources", []) or []),
                "tool_call_count": len(payload.get("tool_calls", []) or []),
                "contains_private_reasoning": contains_private_reasoning,
                **score,
            }
        )

    passed = [row for row in rows if row.get("status") == "ok" and row.get("passed")]
    live_rows = [row for row in rows if row.get("status") == "ok" and row.get("mode") == "live"]
    avg_score = (
        round(
            sum(float(row.get("overall_score", 0)) for row in rows if row.get("status") == "ok")
            / max(len([row for row in rows if row.get("status") == "ok"]), 1),
            2,
        )
        if rows
        else 0.0
    )
    return {
        "base_url": base_url,
        "generated_at": dt.datetime.now(dt.UTC).isoformat(),
        "total": len(rows),
        "passed": len(passed),
        "live_responses": len(live_rows),
        "average_score": avg_score,
        "results": rows,
    }


def print_summary(summary: dict[str, Any]) -> None:
    print(f"Base URL: {summary['base_url']}")
    print(f"Generated: {summary['generated_at']}")
    print(f"Passed: {summary['passed']} / {summary['total']}")
    print(f"Live responses: {summary['live_responses']} / {summary['total']}")
    print(f"Average score: {summary['average_score']}")
    print("-" * 72)
    for item in summary["results"]:
        if item["status"] != "ok":
            print(f"{item['id']:<22} FAILED  {item['error']}")
            continue
        score = item["overall_score"]
        verdict = "PASS" if item["passed"] else "FAIL"
        think_flag = "yes" if item.get("contains_private_reasoning") else "no"
        print(
            f"{item['id']:<22} {verdict:<4} score={score:<5} mode={item.get('mode', 'n/a')} "
            f"sources={item.get('source_count', 0)} think={think_flag}"
        )


def write_markdown_summary(summary: dict[str, Any], output_path: Path) -> None:
    output_path.parent.mkdir(parents=True, exist_ok=True)
    lines: list[str] = []
    lines.append("# Crisis Eval Results")
    lines.append("")
    lines.append(f"- Generated: `{summary['generated_at']}`")
    lines.append(f"- Base URL: `{summary['base_url']}`")
    lines.append(f"- Pass Rate: `{summary['passed']}/{summary['total']}`")
    lines.append(f"- Live Responses: `{summary['live_responses']}/{summary['total']}`")
    lines.append(f"- Average Score: `{summary['average_score']}`")
    lines.append("")
    lines.append("| Scenario | Status | Mode | Score | Sources | Tool Calls | Trace |")
    lines.append("|---|---:|---:|---:|---:|---:|---|")
    for row in summary["results"]:
        if row["status"] != "ok":
            lines.append(f"| `{row['id']}` | FAIL | n/a | n/a | n/a | n/a | `{row['error'][:40]}...` |")
            continue
        verdict = "PASS" if row["passed"] else "FAIL"
        trace = str(row.get("trace_id") or "")[:12]
        lines.append(
            f"| `{row['id']}` | {verdict} | `{row.get('mode', 'n/a')}` | "
            f"`{row.get('overall_score', 0)}` | `{row.get('source_count', 0)}` | "
            f"`{row.get('tool_call_count', 0)}` | `{trace}` |"
        )
    lines.append("")
    output_path.write_text("\n".join(lines) + "\n", encoding="utf-8")


def main() -> int:
    parser = argparse.ArgumentParser(description="Run LifeBridge crisis eval scenarios.")
    parser.add_argument("--base-url", default="http://localhost:8000", help="API base URL")
    parser.add_argument(
        "--output",
        default=str(ROOT / "docs" / "eval_results.json"),
        help="JSON file to write eval results",
    )
    parser.add_argument(
        "--markdown-output",
        default=str(ROOT / "docs" / "eval_results.md"),
        help="Markdown file to write eval summary table",
    )
    args = parser.parse_args()

    summary = run_suite(args.base_url.rstrip("/"))
    print_summary(summary)

    output_path = Path(args.output)
    output_path.parent.mkdir(parents=True, exist_ok=True)
    output_path.write_text(json.dumps(summary, indent=2), encoding="utf-8")
    print(f"\nSaved: {output_path}")
    markdown_path = Path(args.markdown_output)
    write_markdown_summary(summary, markdown_path)
    print(f"Saved: {markdown_path}")
    return 0 if summary["passed"] == summary["total"] else 1


if __name__ == "__main__":
    raise SystemExit(main())

from __future__ import annotations

import re
from dataclasses import dataclass
from typing import List, Sequence


def _norm(s: str) -> str:
    return re.sub(r"\s+", " ", (s or "").strip()).lower()


def _find_chunks(chunks: Sequence[str], keywords: Sequence[str], max_hits: int = 3) -> List[int]:
    keys = [_norm(k) for k in keywords if k.strip()]
    hits: List[int] = []
    for i, c in enumerate(chunks):
        c2 = _norm(c)
        if any(k in c2 for k in keys):
            hits.append(i)
        if len(hits) >= max_hits:
            break
    return hits


@dataclass
class ChecklistItem:
    label: str
    status: str
    notes: str
    evidence_idx: List[int]


@dataclass
class TimelineItem:
    label: str
    due_date: str
    owner: str
    notes: str
    evidence_idx: List[int]


@dataclass
class RiskItem:
    category: str
    severity: str
    statement: str
    reason: str
    evidence_idx: List[int]


@dataclass
class ReasoningResult:
    summary: str
    checklist: List[ChecklistItem]
    timeline: List[TimelineItem]
    risks: List[RiskItem]


def build_reasoning(scenario: str, chunks: Sequence[str]) -> ReasoningResult:
    scenario_n = _norm(scenario)
    text_all = _norm(" ".join(chunks))

    def has_any(*terms: str) -> bool:
        return any(_norm(t) in text_all for t in terms)

    checklist: List[ChecklistItem] = []
    timeline: List[TimelineItem] = []
    risks: List[RiskItem] = []

    # Universal baseline
    checklist.append(
        ChecklistItem(
            label="Collect identity documents for each traveler",
            status="todo",
            notes="Use passports or national IDs. Ensure names and dates match across documents.",
            evidence_idx=_find_chunks(chunks, ["passport", "id", "date of birth", "name"]),
        )
    )
    checklist.append(
        ChecklistItem(
            label="Collect proof of relationship or purpose",
            status="todo",
            notes="Examples: birth certificate, marriage certificate, invitation letter, or enrollment letter.",
            evidence_idx=_find_chunks(chunks, ["birth", "marriage", "invitation", "enrollment"]),
        )
    )

    timeline.append(
        TimelineItem(
            label="Review extracted fields and fix mismatches",
            due_date="",
            owner="user",
            notes="Confirm names, IDs, and dates. Correct errors before submitting anything.",
            evidence_idx=_find_chunks(chunks, ["name", "passport", "id", "dob"]),
        )
    )

    # Scenario-specific
    if "family" in scenario_n or "reunion" in scenario_n:
        checklist.append(
            ChecklistItem(
                label="Prepare a short family context statement",
                status="todo",
                notes="One page. Explain who is traveling, who they will stay with, and the dates.",
                evidence_idx=_find_chunks(chunks, ["relationship", "address", "stay", "family"]),
            )
        )
        timeline.append(
            TimelineItem(
                label="Confirm travel dates and dependent needs",
                due_date="",
                owner="user",
                notes="Capture preferred travel window and constraints like school schedule.",
                evidence_idx=_find_chunks(chunks, ["date", "school", "travel"]),
            )
        )
        if not has_any("birth certificate", "certificate of birth", "birth"):
            risks.append(
                RiskItem(
                    category="documentation",
                    severity="high",
                    statement="Relationship proof may be missing or incomplete",
                    reason="The extracted text does not clearly show a birth or relationship document.",
                    evidence_idx=[],
                )
            )

    if "job" in scenario_n or "onboarding" in scenario_n or "hiring" in scenario_n:
        checklist.append(
            ChecklistItem(
                label="Collect offer letter and role details",
                status="todo",
                notes="Include job title, start date, compensation, and location.",
                evidence_idx=_find_chunks(chunks, ["offer", "employment", "salary", "start date"]),
            )
        )
        if not has_any("offer", "employment"):
            risks.append(
                RiskItem(
                    category="readiness",
                    severity="medium",
                    statement="Offer letter not detected",
                    reason="The system did not find strong signals for an offer or employment letter.",
                    evidence_idx=_find_chunks(chunks, ["offer", "employment"]),
                )
            )

    # General risks
    if has_any("expire", "expiration", "valid until") and has_any("passport"):
        risks.append(
            RiskItem(
                category="documentation",
                severity="medium",
                statement="Document expiration may cause delays",
                reason="At least one document references an expiration or validity window.",
                evidence_idx=_find_chunks(chunks, ["expire", "expiration", "valid until", "validity"], max_hits=5),
            )
        )

    if not risks:
        risks.append(
            RiskItem(
                category="review",
                severity="low",
                statement="No critical conflicts detected in this prototype run",
                reason="This prototype uses conservative checks. Add more documents for deeper analysis.",
                evidence_idx=[],
            )
        )

    summary = (
        "LifeBridge generated a plan from the uploaded documents and intake. "
        "It produced a checklist, a timeline, and a risk register. "
        "Each item links to evidence snippets extracted from the documents."
    )

    return ReasoningResult(summary=summary, checklist=checklist, timeline=timeline, risks=risks)

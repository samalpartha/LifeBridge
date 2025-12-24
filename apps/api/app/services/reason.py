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


def build_reasoning(scenario: str, chunks: Sequence[str], user_story: str = "") -> ReasoningResult:
    scenario_n = _norm(scenario)
    text_all = _norm(" ".join(chunks) + " " + user_story)

    # 1. Try LLM Generation first
    from .llm import generate_case_plan_llm
    llm_plan = generate_case_plan_llm(scenario, user_story, chunks)

    checklist: List[ChecklistItem] = []
    timeline: List[TimelineItem] = []
    risks: List[RiskItem] = []

    if llm_plan:
        # Map LLM JSON to internal objects
        for item in llm_plan.get("checklist", []):
            checklist.append(ChecklistItem(
                label=item.get("label", "Action Item"),
                status=item.get("status", "todo"),
                notes=item.get("notes", ""),
                evidence_idx=_find_chunks(chunks, item.get("evidence_keywords", []))
            ))
        
        for item in llm_plan.get("timeline", []):
            timeline.append(TimelineItem(
                label=item.get("label", "Task"),
                due_date=item.get("due_date", ""),
                owner=item.get("owner", "user"),
                notes=item.get("notes", ""),
                evidence_idx=_find_chunks(chunks, item.get("evidence_keywords", []))
            ))

        for item in llm_plan.get("risks", []):
            risks.append(RiskItem(
                category=item.get("category", "general"),
                severity=item.get("severity", "medium"),
                statement=item.get("statement", "Risk Detected"),
                reason=item.get("reason", ""),
                evidence_idx=_find_chunks(chunks, item.get("evidence_keywords", []))
            ))
            
        return ReasoningResult(
            summary="AI-Generated Case Plan (powered by Gemini)",
            checklist=checklist,
            timeline=timeline,
            risks=risks
        )

    # 2. Fallback to Rule-Based Logic
    def has_any(*terms: str) -> bool:
        return any(_norm(t) in text_all for t in terms)

    # ... (rest of the existing rule-based code below, preserved as fallback) ...
    # Universal baseline
    checklist.append(
        ChecklistItem(
            label="Collect identity documents for each traveler",
            status="todo",
            notes="Use passports or national IDs. Ensure names and dates match across documents.",
            evidence_idx=_find_chunks(chunks, ["passport", "id", "date of birth", "name"]),
        )
    )
    # ... existing logic continues ...
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

    if "deport" in scenario_n or has_any("deport", "removal", "illegal", "status", "problem"):
        checklist.append(
            ChecklistItem(
                label="Consult an attorney immediately regarding status",
                status="todo",
                notes="Deportation proceedings are complex and time-sensitive. Do not ignore notices.",
                evidence_idx=_find_chunks(chunks, ["deport", "court", "notice", "judge"]),
            )
        )
        risks.append(
            RiskItem(
                category="legal_status",
                severity="high",
                statement="Deportation or Status Issue Detected",
                reason="The story or documents mention deportation or status problems. Immediate legal counsel is advised.",
                evidence_idx=[],
            )
        )

    if "study" in scenario_n or has_any("student", "university", "school", "degree", "transcript"):
        checklist.append(
            ChecklistItem(
                label="Gather academic records and transcripts",
                status="todo",
                notes="Include diplomas, current enrollment letters, and official transcripts.",
                evidence_idx=_find_chunks(chunks, ["transcript", "diploma", "degree", "university"]),
            )
        )
        timeline.append(
            TimelineItem(
                label="Check enrollment deadlines",
                due_date="",
                owner="user",
                notes="Ensure you meet the university's start date and orientation requirements.",
                evidence_idx=_find_chunks(chunks, ["deadline", "start date", "orientation"]),
            )
        )

    if "marriage" in scenario_n or has_any("spouse", "marriage", "wedding", "fiance", "wife", "husband"):
        checklist.append(
            ChecklistItem(
                label="Collect proof of bona fide marriage",
                status="todo",
                notes="Photos, joint bank accounts, lease agreements, and affidavits from friends.",
                evidence_idx=_find_chunks(chunks, ["photo", "bank", "lease", "affidavit", "joint"]),
            )
        )
        if not has_any("marriage certificate"):
            risks.append(
                RiskItem(
                    category="documentation",
                    severity="high",
                    statement="Marriage Certificate missing",
                    reason="A certified marriage certificate is critical for spousal cases.",
                    evidence_idx=[],
                )
            )

    # H1B / Work Visa Specifics
    if has_any("h1b", "h-1b", "h1-b", "work visa", "specialty occupation"):
        checklist.append(
            ChecklistItem(
                label="Verify LCA and I-129 Petition details",
                status="todo",
                notes="Ensure the Labor Condition Application (LCA) matches your actual work location and salary.",
                evidence_idx=_find_chunks(chunks, ["lca", "labor condition", "i-129", "petition", "salary"]),
            )
        )
        # Check for stamping issues in user story
        user_story_n = _norm(user_story)
        if "stamp" in user_story_n and ("no" in user_story_n or "not" in user_story_n or "expired" in user_story_n):
             risks.append(
                RiskItem(
                    category="travel_compliance",
                    severity="high",
                    statement="Visa Stamp Required for Re-entry",
                    reason="You indicated a lack of a valid visa stamp. A valid I-797 Approval Notice is NOT enough for travel; you must obtain a stamp at a US Consulate.",
                    evidence_idx=[],
                )
             )
             timeline.append(
                TimelineItem(
                   label="Schedule Consular Appointment (DS-160)",
                   due_date="ASAP",
                   owner="user", 
                   notes="Visa appointment wait times can be long. Complete DS-160 and book immediately.",
                   evidence_idx=[]
                )
             )
        
        if not has_any("i-797", "approval notice", "form i-797"):
             risks.append(
                RiskItem(
                    category="documentation",
                    severity="medium",
                    statement="I-797 Approval Notice not detected",
                    reason="Travel requires the original I-797 Approval Notice. Digital copies are often insufficient.",
                    evidence_idx=_find_chunks(chunks, ["i-797", "approval"]),
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
                category="status",
                severity="low",
                statement="Standard Review: No high-severity blocked items detected",
                reason="Automatic analysis did not find specific blockers (like deportation orders or missing passport). Ensure all documents are unexpired.",
                evidence_idx=[],
            )
        )

    # If nothing specific was found, add a generic item so the user sees *something*
    if not checklist and not risks:
        checklist.append(
            ChecklistItem(
                label="Review uploaded documents manually",
                status="todo",
                notes="The system didn't detect specific keywords like 'marriage' or 'school', but your documents are saved.",
                evidence_idx=[],
            )
        )
        risks.append(
            RiskItem(
                category="general",
                severity="low",
                statement="No specific risks identified",
                reason="Automatic analysis didn't flag common issues. Please review your documents against standard requirements.",
                evidence_idx=[],
            )
        )

    summary = (
        "LifeBridge generated a plan from the uploaded documents and intake. "
        "It produced a checklist, a timeline, and a risk register. "
        "Each item links to evidence snippets extracted from the documents."
    )

    return ReasoningResult(summary=summary, checklist=checklist, timeline=timeline, risks=risks)

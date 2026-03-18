"""Gradient AI evaluation suite for LifeBridge Crisis Corridor.

Tests agent quality across various crisis scenarios.
"""
from __future__ import annotations

from typing import Any

from ..utils.logger import get_logger

logger = get_logger(__name__)


# Evaluation test cases
CRISIS_EVAL_SCENARIOS = [
    {
        "id": "child_no_vehicle",
        "name": "Family with Child, No Vehicle",
        "query": "I have a 3-year-old child and no car. We need to find shelter within 5km. It's 3pm.",
        "context": {
            "has_children": True,
            "has_vehicle": False,
            "max_distance_km": 5,
            "time_of_day": "afternoon",
        },
        "expected_constraints": [
            "child-friendly shelter",
            "walking distance",
            "daytime travel",
            "rest points",
        ],
        "expected_behaviors": [
            "multiple route options",
            "shortest distance prioritized",
            "accessible facilities mentioned",
            "safety considerations for children",
        ],
    },
    {
        "id": "wheelchair_access",
        "name": "Wheelchair User Needs Hospital",
        "query": "I use a wheelchair and need to reach a hospital for medication. What's the best accessible route?",
        "context": {
            "mobility_constraint": "wheelchair",
            "destination_type": "hospital",
            "accessibility_required": True,
        },
        "expected_constraints": [
            "wheelchair accessible",
            "paved surfaces",
            "minimal elevation",
            "ramps available",
        ],
        "expected_behaviors": [
            "accessible route emphasized",
            "surface conditions mentioned",
            "alternative options if needed",
            "hospital services confirmed",
        ],
    },
    {
        "id": "night_travel_curfew",
        "name": "Night Travel with Curfew",
        "query": "It's 8pm and I need to reach an embassy. There's a curfew from 10pm to 6am. How should I navigate?",
        "context": {
            "time_of_day": "night",
            "curfew_start": "22:00",
            "curfew_end": "06:00",
            "urgency": "high",
        },
        "expected_constraints": [
            "curfew time window",
            "night safety risks",
            "time-critical routing",
            "fastest route needed",
        ],
        "expected_behaviors": [
            "urgency acknowledged",
            "curfew timing considered",
            "risk factors explained",
            "alternative: wait until morning",
        ],
    },
    {
        "id": "family_of_five",
        "name": "Large Family Needs Food and Water",
        "query": "We are a family of 5 (2 adults, 3 children ages 2-8). Need food, water, and shelter. Can carry limited supplies.",
        "context": {
            "family_size": 5,
            "children_count": 3,
            "needs": ["food", "water", "shelter"],
            "carrying_capacity": "limited",
        },
        "expected_constraints": [
            "family capacity",
            "child ages considered",
            "multiple needs addressed",
            "supply limitations",
        ],
        "expected_behaviors": [
            "haven with all services",
            "family-friendly priority",
            "realistic distance for children",
            "services availability confirmed",
        ],
    },
    {
        "id": "medical_emergency",
        "name": "Medical Emergency - Diabetic Needs Insulin",
        "query": "Emergency: I'm diabetic and running out of insulin. Where's the nearest medical facility that can help?",
        "context": {
            "urgency": "critical",
            "medical_condition": "diabetes",
            "medication_needed": "insulin",
        },
        "expected_constraints": [
            "medical facility required",
            "immediate need",
            "medication availability",
        ],
        "expected_behaviors": [
            "urgency prioritized",
            "nearest medical haven",
            "fastest route recommended",
            "backup options provided",
        ],
    },
    {
        "id": "language_barrier",
        "name": "Non-Local Language Speaker",
        "query": "I don't speak the local language. Which havens have translators or multilingual staff?",
        "context": {
            "language_barrier": True,
            "assistance_type": "translation",
        },
        "expected_constraints": [
            "translation services",
            "communication support",
            "international organizations",
        ],
        "expected_behaviors": [
            "embassies mentioned",
            "UN facilities highlighted",
            "translation services noted",
            "visual communication tips",
        ],
    },
]


def score_agent_response(
    query: str,
    response: str,
    expected_constraints: list[str],
    expected_behaviors: list[str],
) -> dict[str, Any]:
    """Score an agent response against expected criteria.

    Returns:
        Dict with scores and feedback
    """
    response_lower = response.lower()

    # Score constraints (did agent consider them?)
    constraints_found = sum(
        1 for constraint in expected_constraints
        if any(word in response_lower for word in constraint.lower().split())
    )
    constraints_score = (constraints_found / len(expected_constraints)) * 100 if expected_constraints else 100

    # Score behaviors (did agent exhibit them?)
    behaviors_found = sum(
        1 for behavior in expected_behaviors
        if any(word in response_lower for word in behavior.lower().split())
    )
    behaviors_score = (behaviors_found / len(expected_behaviors)) * 100 if expected_behaviors else 100

    # Check for multiple options (critical safety requirement)
    has_multiple_options = (
        "option" in response_lower and
        ("route" in response_lower or "choice" in response_lower or "alternative" in response_lower)
    )
    multiple_options_score = 100 if has_multiple_options else 0

    # Check for reasoning (transparency requirement)
    has_reasoning = any(
        word in response_lower
        for word in ["because", "reason", "due to", "since", "as", "factor"]
    )
    reasoning_score = 100 if has_reasoning else 50

    # Overall score (weighted average)
    overall_score = (
        constraints_score * 0.3 +
        behaviors_score * 0.3 +
        multiple_options_score * 0.2 +
        reasoning_score * 0.2
    )

    feedback = []
    if constraints_score < 70:
        feedback.append(f"Missing {len(expected_constraints) - constraints_found} key constraints")
    if behaviors_score < 70:
        feedback.append(f"Missing {len(expected_behaviors) - behaviors_found} expected behaviors")
    if not has_multiple_options:
        feedback.append("CRITICAL: Did not provide multiple options (safety requirement)")
    if not has_reasoning:
        feedback.append("Missing clear reasoning for recommendations")

    return {
        "overall_score": round(overall_score, 1),
        "constraints_score": round(constraints_score, 1),
        "behaviors_score": round(behaviors_score, 1),
        "multiple_options_score": multiple_options_score,
        "reasoning_score": reasoning_score,
        "constraints_found": constraints_found,
        "constraints_total": len(expected_constraints),
        "behaviors_found": behaviors_found,
        "behaviors_total": len(expected_behaviors),
        "feedback": feedback,
        "passed": overall_score >= 70,
    }


async def run_full_evaluation_suite() -> dict[str, Any]:
    """Run all evaluation scenarios and return results.

    This would integrate with Gradient AI's evaluation API in production.
    For now, returns the test scenarios for manual testing.
    """
    logger.info("evaluation_suite_started", scenarios=len(CRISIS_EVAL_SCENARIOS))

    return {
        "total_scenarios": len(CRISIS_EVAL_SCENARIOS),
        "scenarios": CRISIS_EVAL_SCENARIOS,
        "status": "ready_for_testing",
        "instructions": (
            "Run each scenario through the agent and score the responses. "
            "Passing score: 70% or higher on all metrics."
        ),
    }

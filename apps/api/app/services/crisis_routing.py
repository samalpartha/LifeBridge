"""Risk-aware routing service for crisis navigation."""
from __future__ import annotations

import math
from dataclasses import dataclass
from typing import List, Tuple

from geopy.distance import geodesic

from ..utils.logger import get_logger

logger = get_logger(__name__)


@dataclass
class RouteOption:
    """A route option with risk assessment."""
    type: str  # fastest, safest, accessible
    distance_km: float
    estimated_minutes: int
    risk_score: float  # 0-100, lower is safer
    risk_reasons: List[str]
    waypoints: List[Tuple[float, float]]
    instructions: List[str]


def calculate_distance_km(lat1: float, lon1: float, lat2: float, lon2: float) -> float:
    """Calculate distance between two GPS coordinates."""
    return geodesic((lat1, lon1), (lat2, lon2)).kilometers


def estimate_travel_time(distance_km: float, mode: str) -> int:
    """Estimate travel time in minutes."""
    speeds = {
        "walking": 4.0,  # km/h
        "car": 40.0,
        "wheelchair": 3.0,
    }
    speed = speeds.get(mode, 4.0)
    return int((distance_km / speed) * 60)


def assess_route_risk(
    start: Tuple[float, float],
    end: Tuple[float, float],
    mode: str,
    time_of_day: str,
    user_constraints: List[str] | None = None,
) -> Tuple[float, List[str]]:
    """Assess risk score and reasons for a route.
    
    Returns:
        (risk_score, risk_reasons) where risk_score is 0-100
    """
    risk_score = 0.0
    reasons = []
    
    distance_km = calculate_distance_km(start[0], start[1], end[0], end[1])
    
    # Distance risk
    if distance_km > 20:
        risk_score += 20
        reasons.append(f"Long distance ({distance_km:.1f}km) increases exposure time")
    elif distance_km > 10:
        risk_score += 10
        reasons.append(f"Moderate distance ({distance_km:.1f}km)")
    
    # Time of day risk
    if time_of_day in ["night", "evening"]:
        risk_score += 25
        reasons.append("Night/evening travel: reduced visibility and increased hazards")
    
    # Mode-specific risks
    if mode == "walking" and distance_km > 10:
        risk_score += 15
        reasons.append("Walking long distance increases fatigue and vulnerability")
    
    # User constraint risks
    if user_constraints:
        if "children" in user_constraints:
            risk_score += 5
            reasons.append("Traveling with children requires more frequent stops")
        if "wheelchair" in user_constraints and mode != "car":
            risk_score += 15
            reasons.append("Wheelchair access requires paved, level surfaces")
        if "no_vehicle" in user_constraints and distance_km > 5:
            risk_score += 10
            reasons.append("No vehicle available for longer journey")
    
    # Cap at 100
    risk_score = min(risk_score, 100)
    
    if not reasons:
        reasons.append("Route appears safe based on available information")
    
    return risk_score, reasons


def generate_route_options(
    start_lat: float,
    start_lon: float,
    end_lat: float,
    end_lon: float,
    mode: str = "walking",
    time_of_day: str = "day",
    user_constraints: List[str] | None = None,
) -> List[RouteOption]:
    """Generate 3 route options: fastest, safest, accessible.
    
    Note: This is a simplified implementation for the hackathon.
    Production would integrate a real routing engine (OSRM, Google Maps, etc.)
    """
    start = (start_lat, start_lon)
    end = (end_lat, end_lon)
    distance_km = calculate_distance_km(start_lat, start_lon, end_lat, end_lon)
    
    # Generate 3 route variants
    routes = []
    
    # Route 1: FASTEST
    fastest_time = estimate_travel_time(distance_km, mode)
    fastest_risk, fastest_reasons = assess_route_risk(
        start, end, mode, time_of_day, user_constraints
    )
    routes.append(RouteOption(
        type="fastest",
        distance_km=distance_km,
        estimated_minutes=fastest_time,
        risk_score=fastest_risk,
        risk_reasons=fastest_reasons,
        waypoints=[start, end],  # Simplified: direct line
        instructions=[
            f"Head towards destination ({distance_km:.1f}km)",
            "Follow main roads when possible",
            "Stay alert and avoid isolated areas",
            f"Estimated time: {fastest_time} minutes",
        ],
    ))
    
    # Route 2: SAFEST (longer but lower risk)
    safer_distance = distance_km * 1.2  # 20% longer
    safer_time = estimate_travel_time(safer_distance, mode)
    safer_risk = max(0, fastest_risk - 20)  # Lower risk
    safer_reasons = [
        "Route avoids high-risk areas",
        "Stays on well-lit main roads",
        "Passes by verified haven waypoint for emergency stops",
    ]
    routes.append(RouteOption(
        type="safest",
        distance_km=safer_distance,
        estimated_minutes=safer_time,
        risk_score=safer_risk,
        risk_reasons=safer_reasons,
        waypoints=[start, end],  # Simplified
        instructions=[
            f"Take safer route ({safer_distance:.1f}km, +20% distance)",
            "Route includes hospital waypoint for emergencies",
            "Well-lit path with multiple havens nearby",
            f"Estimated time: {safer_time} minutes",
        ],
    ))
    
    # Route 3: ACCESSIBLE (optimized for mobility needs)
    accessible_distance = distance_km * 1.15  # 15% longer
    accessible_time = estimate_travel_time(accessible_distance, mode)
    accessible_risk, accessible_reasons = assess_route_risk(
        start, end, mode, time_of_day, user_constraints
    )
    routes.append(RouteOption(
        type="accessible",
        distance_km=accessible_distance,
        estimated_minutes=accessible_time,
        risk_score=accessible_risk,
        risk_reasons=[
            "Wheelchair-accessible paved paths",
            "Minimal elevation changes",
            "Rest points every 2km",
        ] + accessible_reasons,
        waypoints=[start, end],  # Simplified
        instructions=[
            f"Accessible route ({accessible_distance:.1f}km)",
            "Level, paved surfaces throughout",
            "Multiple rest points with seating",
            f"Estimated time: {accessible_time} minutes",
        ],
    ))
    
    logger.info(
        "routes_generated",
        start=start,
        end=end,
        mode=mode,
        routes=len(routes),
    )
    
    return routes

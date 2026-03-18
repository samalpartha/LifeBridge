"""Service-level tests for crisis routing and orchestration behavior."""

from app.services.crisis_routing import generate_route_options


def test_generate_route_options_returns_three_profiles() -> None:
    routes = generate_route_options(
        start_lat=35.0,
        start_lon=36.0,
        end_lat=35.05,
        end_lon=36.05,
        mode="walking",
        time_of_day="day",
        user_constraints=["children"],
    )
    assert len(routes) == 3
    route_types = {route.type for route in routes}
    assert route_types == {"fastest", "safest", "accessible"}


def test_night_route_has_higher_risk_than_day_for_same_path() -> None:
    day_route = generate_route_options(
        start_lat=35.0,
        start_lon=36.0,
        end_lat=35.08,
        end_lon=36.08,
        mode="walking",
        time_of_day="day",
        user_constraints=[],
    )[0]
    night_route = generate_route_options(
        start_lat=35.0,
        start_lon=36.0,
        end_lat=35.08,
        end_lon=36.08,
        mode="walking",
        time_of_day="night",
        user_constraints=[],
    )[0]
    assert night_route.risk_score >= day_route.risk_score

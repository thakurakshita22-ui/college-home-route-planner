def rank_routes(routes, preference):
    if not routes:
        return []
    def score(route):
        if preference == "fastest":
            return route["duration_min"]
        if preference == "shortest":
            return route["distance_km"]
        if preference == "cost":
            return float("inf") if route.get("cost_inr") is None else route["cost_inr"]
        # Normalize each measure against the best available route, then average.
        d = route["distance_km"] / max(r["distance_km"] for r in routes)
        t = route["duration_min"] / max(r["duration_min"] for r in routes)
        costs = [r.get("cost_inr") for r in routes if r.get("cost_inr") is not None]
        c = (route.get("cost_inr") or 0) / max(costs) if costs and max(costs) else 0
        return (d + t + c) / 3
    return sorted(routes, key=score)

def estimate_cost(distance_km, mode, mileage=15, fuel_price=100):
    if mode == "walking":
        return {"cost_inr": 0, "cost_label": "No fuel cost", "fuel_litres": 0}
    if mode not in {"car", "bike"}:
        return {"cost_inr": None, "cost_label": "Fare unavailable", "fuel_litres": None}
    mileage, fuel_price = float(mileage), float(fuel_price)
    if mileage <= 0 or fuel_price < 0:
        raise ValueError("Mileage must be above zero and fuel price cannot be negative.")
    litres = float(distance_km) / mileage
    cost = litres * fuel_price
    return {"cost_inr": round(cost, 2), "cost_label": "Estimated fuel cost", "fuel_litres": round(litres, 3)}

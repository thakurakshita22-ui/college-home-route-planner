from flask import Flask, render_template, request, jsonify, send_file
from services.geocoding import geocode, suggestions
from services.routing import get_routes
from services.cost_calculator import estimate_cost
from services.optimization import rank_routes
from config import COLLEGE_NAME, COLLEGE_LAT, COLLEGE_LON
import io, csv, json, time

app = Flask(__name__)
app.config["JSON_SORT_KEYS"] = False

@app.get("/")
def index():
    return render_template("index.html", college_name=COLLEGE_NAME,
                           college_lat=COLLEGE_LAT, college_lon=COLLEGE_LON)

@app.get("/api/suggest")
def suggest():
    q = request.args.get("q", "").strip()
    if len(q) < 3:
        return jsonify([])
    try:
        return jsonify(suggestions(q))
    except Exception:
        return jsonify([])

@app.post("/api/route")
def route():
    started = time.perf_counter()
    data = request.get_json(silent=True) or {}
    destination = str(data.get("destination", "")).strip()
    mode = str(data.get("mode", "car")).lower()
    preference = str(data.get("preference", "balanced")).lower()
    origin_text = str(data.get("origin", COLLEGE_NAME)).strip()
    if not destination:
        return jsonify(error="Enter a destination to find a route."), 400
    if mode not in {"car", "bike", "walking", "bus"}:
        return jsonify(error="Choose a supported travel mode."), 400
    if preference not in {"fastest", "shortest", "cost", "balanced"}:
        return jsonify(error="Choose a route preference."), 400
    if mode == "bus":
        return jsonify(error="Bus routing is not supported by the configured road-routing service. Choose car, bike, or walking; enter a bus fare in settings only for your own estimate."), 422
    try:
        origin = geocode(origin_text) if origin_text.lower() not in {
            COLLEGE_NAME.lower(), "college", "chandigarh university"
        } else {"name": COLLEGE_NAME, "lat": COLLEGE_LAT, "lon": COLLEGE_LON}
        dest = geocode(destination)
        routes = get_routes(origin, dest, mode)
        mileage = float(data.get("mileage", 15))
        fuel_price = float(data.get("fuel_price", 100))
        if mileage <= 0 or fuel_price < 0 or mileage > 200 or fuel_price > 1000:
            return jsonify(error="Check your mileage and fuel price values."), 400
        for r in routes:
            r.update(estimate_cost(r["distance_km"], mode, mileage, fuel_price))
        ranked = rank_routes(routes, preference)
        for i, r in enumerate(ranked):
            r["recommended"] = i == 0
            r["reason"] = {
                "fastest": "Lowest estimated travel time.",
                "shortest": "Shortest available road route.",
                "cost": "Lowest estimated fuel cost.",
                "balanced": "Best balance of distance, estimated time, and cost."
            }[preference] if i == 0 else "Alternative route for comparison."
            r["id"] = i + 1
        return jsonify(
            origin=origin, destination=dest, mode=mode, preference=preference,
            routes=ranked, elapsed_ms=round((time.perf_counter()-started)*1000, 1),
            traffic="Live traffic unavailable", provider="OSRM / OpenStreetMap"
        )
    except ValueError as e:
        return jsonify(error=str(e)), 400
    except Exception as e:
        return jsonify(error=f"Could not calculate this route right now. Check the destination and try again. ({type(e).__name__})"), 502

@app.post("/api/export")
def export():
    data = request.get_json(silent=True) or {}
    routes = data.get("routes", [])
    output = io.StringIO()
    writer = csv.writer(output)
    writer.writerow(["Route", "Distance (km)", "Estimated time (min)", "Estimated fuel cost (INR)", "Preference"])
    for r in routes:
        writer.writerow([r.get("id"), r.get("distance_km"), r.get("duration_min"), r.get("cost_inr"), data.get("preference", "")])
    payload = io.BytesIO(output.getvalue().encode("utf-8-sig"))
    payload.seek(0)
    return send_file(payload, mimetype="text/csv", as_attachment=True, download_name="route-summary.csv")

if __name__ == "__main__":
    app.run(debug=True)

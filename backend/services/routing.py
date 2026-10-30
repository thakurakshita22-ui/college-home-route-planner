import requests
from config import REQUEST_TIMEOUT

OSRM_PROFILES = {"car": "driving", "bike": "cycling", "walking": "walking"}

def get_routes(origin, destination, mode):
    profile = OSRM_PROFILES.get(mode)
    if not profile:
        raise ValueError("This travel mode is not supported.")
    coords = f'{origin["lon"]},{origin["lat"]};{destination["lon"]},{destination["lat"]}'
    url = f"https://router.project-osrm.org/route/v1/{profile}/{coords}"
    response = requests.get(url, params={"alternatives": "true", "overview": "full", "geometries": "geojson", "steps": "false"}, timeout=REQUEST_TIMEOUT)
    response.raise_for_status()
    body = response.json()
    if body.get("code") != "Ok" or not body.get("routes"):
        raise ValueError("No road route was found between these locations.")
    result = []
    for route in body["routes"][:3]:
        result.append({
            "distance_km": round(route["distance"] / 1000, 2),
            "duration_min": round(route["duration"] / 60),
            "geometry": route["geometry"],
            "legs": route.get("legs", []),
            "source": "OSRM estimate"
        })
    return result

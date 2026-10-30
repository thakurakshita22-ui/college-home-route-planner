import requests
from config import USER_AGENT, REQUEST_TIMEOUT

HEADERS = {"User-Agent": USER_AGENT}

def geocode(query):
    query = (query or "").strip()
    if len(query) < 3:
        raise ValueError("Enter a more specific destination.")
    response = requests.get(
        "https://nominatim.openstreetmap.org/search",
        params={"q": query, "format": "jsonv2", "limit": 1, "countrycodes": "in"},
        headers=HEADERS, timeout=REQUEST_TIMEOUT
    )
    response.raise_for_status()
    items = response.json()
    if not items:
        raise ValueError("Location not found. Try a nearby town, locality, or full address.")
    item = items[0]
    return {"name": item.get("display_name", query), "lat": float(item["lat"]), "lon": float(item["lon"])}

def suggestions(query):
    response = requests.get(
        "https://nominatim.openstreetmap.org/search",
        params={"q": query, "format": "jsonv2", "limit": 5, "countrycodes": "in"},
        headers=HEADERS, timeout=REQUEST_TIMEOUT
    )
    response.raise_for_status()
    return [{"name": x.get("display_name", ""), "lat": float(x["lat"]), "lon": float(x["lon"])}
            for x in response.json()]

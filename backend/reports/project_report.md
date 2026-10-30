# Project Report — Route Planner

## Summary
Route Planner is a visitor-facing Flask application for finding road routes from a starting point to a destination. The default start is Chandigarh University, Gharuan, Punjab. The interface emphasizes the route form, interactive map, and concise route alternatives rather than academic explanations.

## Architecture
- **Flask (`app.py`)**: page rendering and JSON endpoints.
- **Geocoding service**: Nominatim lookup and suggestions.
- **Routing service**: OSRM route geometry, distance, and duration.
- **Optimization service**: ranks available routes by time, distance, estimated fuel cost, or normalized balanced score.
- **Cost calculator**: estimates fuel consumed and cost using user-configured mileage and fuel price.
- **Algorithms**: independent NetworkX-compatible Dijkstra and A* routines, tested on small weighted graphs.
- **Frontend**: HTML templates, CSS, Leaflet, and small browser JavaScript for map interactions and local route storage.

## Data integrity and limitations
The app requests real road-route geometry from OSRM instead of drawing straight-line route claims. Public routing and geocoding services can be unavailable or rate limited. There is no live traffic integration, bus timetable provider, fare provider, or road-closure feed; the UI explicitly discloses these limitations. The balanced option ranks only the route alternatives returned by OSRM and is not a guarantee of global optimality.

## Algorithm validation
Dijkstra and A* are implemented as reusable graph algorithms. The tests verify route costs and unreachable destinations. A* optimality depends on using an admissible heuristic; the included tests use a zero heuristic, which is equivalent to Dijkstra for validation.

## Privacy
Saved routes and history use browser local storage only. There is no account system and no server-side destination history. Users should avoid saving sensitive locations on shared devices.

## Future production hardening
Use a contracted routing/geocoding provider with documented availability, configure caching and rate limits, add server-side request throttling, and provide provider-specific transit routing if bus directions are required.

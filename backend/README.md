# Route Planner

A compact Flask route-planning web app centered on Chandigarh University, Gharuan, Punjab. It uses OpenStreetMap-compatible geocoding and OSRM road routing for available car, bike/cycling, and walking routes.

## Features
- Dark responsive interface with interactive Leaflet map.
- Destination lookup and suggestions through Nominatim.
- Up to three route alternatives when OSRM returns them.
- Fastest, shortest, lowest estimated fuel cost, and balanced ranking.
- Fuel-cost estimate for car/bike; zero fuel cost for walking.
- Local saved routes and recent search history, CSV export, and share/copy summary.
- Separate tested Dijkstra and A* implementations for weighted NetworkX graphs.

## Requirements
Python 3.10 or newer. Internet access is needed for map tiles, geocoding, and routing.

## Windows setup (PowerShell)
```powershell
cd college_home_route_planner
py -m venv .venv
.\.venv\Scripts\Activate.ps1
python -m pip install --upgrade pip
pip install -r requirements.txt
python app.py
```
Open `http://127.0.0.1:5000` in your browser. In VS Code, open this folder, choose the `.venv` Python interpreter, and run `app.py` or use the integrated terminal.

If PowerShell blocks activation, run `Set-ExecutionPolicy -Scope Process -ExecutionPolicy Bypass` in that terminal, then activate the environment.

## Run tests
```powershell
pytest -q
```

## Service and accuracy notes
- The default origin pin is a campus-area location for Chandigarh University, Gharuan. The official university site confirms the Gharuan/Mohali campus address; the pin can be adjusted if your intended gate differs.
- OSRM public demo routing is best-effort and has usage limits. The current configuration does not provide live traffic, closures, transit timetables, or bus routing. Bus is explicitly marked unavailable.
- Route duration is an estimate without live traffic. Fuel costs depend on the mileage and price configured in Settings; walking has zero fuel cost.
- Nominatim has a public-use policy and should not be bulk queried. Suggestions are debounced in the browser; for production traffic, configure a suitable geocoder and follow its usage policy.
- Saved routes and history are stored in this browser's local storage. They are not uploaded to a user account. Avoid saving sensitive home addresses on shared devices.
- Leaflet, map tiles, and Google Fonts are loaded from external services and require an internet connection.

## Project structure
```text
college_home_route_planner/
├── app.py
├── config.py
├── requirements.txt
├── README.md
├── algorithms/
│   ├── dijkstra.py
│   ├── astar.py
│   └── alternatives.py
├── services/
│   ├── geocoding.py
│   ├── routing.py
│   ├── optimization.py
│   └── cost_calculator.py
├── templates/
│   ├── base.html
│   └── index.html
├── static/
│   ├── css/style.css
│   └── js/map.js
├── tests/
└── reports/project_report.md
```

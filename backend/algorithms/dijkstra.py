import heapq

def dijkstra(graph, start, goal, weight="weight"):
    """Return (path, total_cost, explored_count); raises ValueError if unreachable."""
    if start not in graph or goal not in graph:
        raise ValueError("Start or destination is not present in the graph.")
    queue = [(0, start)]
    distances, previous = {start: 0}, {}
    explored = 0
    while queue:
        cost, node = heapq.heappop(queue)
        if cost != distances.get(node):
            continue
        explored += 1
        if node == goal:
            path = [goal]
            while path[-1] != start:
                path.append(previous[path[-1]])
            return list(reversed(path)), cost, explored
        for neighbor, attrs in graph[node].items():
            candidate = cost + float(attrs.get(weight, 1))
            if candidate < distances.get(neighbor, float("inf")):
                distances[neighbor] = candidate
                previous[neighbor] = node
                heapq.heappush(queue, (candidate, neighbor))
    raise ValueError("Destination is unreachable.")


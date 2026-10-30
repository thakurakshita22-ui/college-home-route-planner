import heapq

def astar(graph, start, goal, heuristic, weight="weight"):
    """Return (path, total_cost, explored_count). Heuristic must be admissible for optimality."""
    if start not in graph or goal not in graph:
        raise ValueError("Start or destination is not present in the graph.")
    queue = [(float(heuristic(start, goal)), 0, start)]
    g_score, previous, explored = {start: 0}, {}, 0
    while queue:
        _, cost, node = heapq.heappop(queue)
        if cost != g_score.get(node):
            continue
        explored += 1
        if node == goal:
            path = [goal]
            while path[-1] != start:
                path.append(previous[path[-1]])
            return list(reversed(path)), cost, explored
        for neighbor, attrs in graph[node].items():
            candidate = cost + float(attrs.get(weight, 1))
            if candidate < g_score.get(neighbor, float("inf")):
                g_score[neighbor] = candidate
                previous[neighbor] = node
                priority = candidate + float(heuristic(neighbor, goal))
                heapq.heappush(queue, (priority, candidate, neighbor))
    raise ValueError("Destination is unreachable.")

import networkx as nx

def alternative_paths(graph, start, goal, weight="weight", limit=3):
    """Generate loop-free candidate paths ordered by the selected edge weight."""
    try:
        paths = nx.shortest_simple_paths(graph, start, goal, weight=weight)
        return [p for _, p in zip(range(limit), paths)]
    except (nx.NetworkXNoPath, nx.NodeNotFound):
        return []

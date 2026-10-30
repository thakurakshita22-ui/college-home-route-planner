import networkx as nx
import pytest
from algorithms.astar import astar

def test_astar_finds_optimal_path_with_zero_heuristic():
    g=nx.Graph()
    g.add_edge("A","B",weight=2);g.add_edge("A","C",weight=1)
    g.add_edge("C","B",weight=1);g.add_edge("B","D",weight=3)
    g.add_edge("C","D",weight=8)
    path,cost,explored=astar(g,"A","D",lambda a,b:0)
    assert path==["A","B","D"] or path==["A","C","B","D"]
    assert cost==5
    assert explored>0

def test_astar_unreachable():
    g=nx.Graph();g.add_nodes_from(["A","Z"])
    with pytest.raises(ValueError): astar(g,"A","Z",lambda a,b:0)

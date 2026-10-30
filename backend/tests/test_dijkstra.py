import networkx as nx
import pytest
from algorithms.dijkstra import dijkstra

def graph():
    g=nx.Graph()
    g.add_edge("A","B",weight=2);g.add_edge("A","C",weight=1)
    g.add_edge("C","B",weight=1);g.add_edge("B","D",weight=3)
    g.add_edge("C","D",weight=8)
    return g

def test_dijkstra_shortest_cost():
    path,cost,explored=dijkstra(graph(),"A","D")
    assert path[0]=="A" and path[-1]=="D"
    assert cost==5
    assert explored>0

def test_dijkstra_unreachable():
    g=graph();g.add_node("Z")
    with pytest.raises(ValueError): dijkstra(g,"A","Z")

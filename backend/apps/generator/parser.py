from apps.generator.blueprint import AnvayaBlueprint, CanvasNode, CanvasEdge
from collections import defaultdict, deque


class ParsedGraph:
    def __init__(self):
        self.nodes: dict[str, CanvasNode] = {}
        self.adjacency: dict[str, list[str]] = defaultdict(list)
        self.in_degree: dict[str, int] = defaultdict(int)
        self.errors: list[str] = []
        self.is_valid: bool = True


def parse_blueprint(blueprint: AnvayaBlueprint) -> ParsedGraph:
    graph = ParsedGraph()

    for node in blueprint.nodes:
        graph.nodes[node.id] = node
        graph.in_degree[node.id] = graph.in_degree.get(node.id, 0)

    for edge in blueprint.edges:
        graph.adjacency[edge.source].append(edge.target)
        graph.in_degree[edge.target] = graph.in_degree.get(edge.target, 0) + 1

    # Validate: must have at least one route and one response
    node_types = [n.type for n in blueprint.nodes]

    if "route" not in node_types:
        graph.errors.append("Canvas must have at least one Route block")

    if "response" not in node_types:
        graph.errors.append("Canvas must have at least one Response block")

    if len(blueprint.nodes) == 0:
        graph.errors.append("Canvas is empty — add some blocks first")

    graph.is_valid = len(graph.errors) == 0
    return graph


def topological_sort(graph: ParsedGraph) -> list[CanvasNode]:
    """Kahn's Algorithm — returns nodes in execution order."""
    in_degree = dict(graph.in_degree)
    queue = deque([nid for nid, deg in in_degree.items() if deg == 0])
    sorted_nodes: list[CanvasNode] = []

    while queue:
        node_id = queue.popleft()
        node = graph.nodes.get(node_id)
        if node:
            sorted_nodes.append(node)

        for neighbor in graph.adjacency.get(node_id, []):
            in_degree[neighbor] -= 1
            if in_degree[neighbor] == 0:
                queue.append(neighbor)

    if len(sorted_nodes) != len(graph.nodes):
        raise ValueError("Circular dependency detected in canvas")

    return sorted_nodes

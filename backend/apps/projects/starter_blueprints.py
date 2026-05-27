"""Starter blueprints seeded into a new project's Blueprint v1.

When ``POST /o/{slug}/projects`` is called with ``template`` set to one of the
keys below, the auto-created Blueprint uses that canvas instead of the empty
one. Kept here (rather than in the views file) so the management command can
also reach them.
"""

from __future__ import annotations

from typing import Any


def _route(node_id: str, x: int, y: int, method: str, path: str, desc: str = "") -> dict:
    return {
        "id": node_id,
        "type": "route",
        "position": {"x": x, "y": y},
        "data": {"method": method, "path": path, "description": desc},
    }


def _auth(node_id: str, x: int, y: int, strategy: str = "jwt", env_var: str = "JWT_SECRET") -> dict:
    return {
        "id": node_id,
        "type": "auth",
        "position": {"x": x, "y": y},
        "data": {"strategy": strategy, "secret_env_var": env_var},
    }


def _db(node_id: str, x: int, y: int, model: str, action: str, provider: str = "postgres") -> dict:
    return {
        "id": node_id,
        "type": "database",
        "position": {"x": x, "y": y},
        "data": {"provider": provider, "model": model, "action": action},
    }


def _response(node_id: str, x: int, y: int, status: int = 200) -> dict:
    return {
        "id": node_id,
        "type": "response",
        "position": {"x": x, "y": y},
        "data": {"status_code": status, "body": "data"},
    }


def _edge(eid: str, source: str, target: str) -> dict:
    return {"id": eid, "source": source, "target": target}


# ── Todo API (3 routes) ──────────────────────────────────────────────────────
_TODO = {
    "version": "1.0.0",
    "nodes": [
        _route("r_list", 0, 100, "GET", "/todos", "List todos"),
        _auth("a_list", 250, 100),
        _db("d_list", 500, 100, "Todo", "findAll"),
        _response("resp_list", 750, 100),
        _route("r_create", 0, 300, "POST", "/todos", "Create todo"),
        _auth("a_create", 250, 300),
        _db("d_create", 500, 300, "Todo", "create"),
        _response("resp_create", 750, 300, status=201),
        _route("r_delete", 0, 500, "DELETE", "/todos/:id", "Delete todo"),
        _auth("a_delete", 250, 500),
        _db("d_delete", 500, 500, "Todo", "delete"),
        _response("resp_delete", 750, 500, status=204),
    ],
    "edges": [
        _edge("e1", "r_list", "a_list"), _edge("e2", "a_list", "d_list"), _edge("e3", "d_list", "resp_list"),
        _edge("e4", "r_create", "a_create"), _edge("e5", "a_create", "d_create"), _edge("e6", "d_create", "resp_create"),
        _edge("e7", "r_delete", "a_delete"), _edge("e8", "a_delete", "d_delete"), _edge("e9", "d_delete", "resp_delete"),
    ],
}

# ── E-commerce cart (4 routes) ───────────────────────────────────────────────
_CART = {
    "version": "1.0.0",
    "nodes": [
        _route("r_products", 0, 100, "GET", "/products", "List products"),
        _db("d_products", 350, 100, "Product", "findAll"),
        _response("resp_products", 700, 100),
        _route("r_cart_add", 0, 300, "POST", "/cart", "Add to cart"),
        _auth("a_cart_add", 250, 300),
        _db("d_cart_add", 500, 300, "Cart", "create"),
        _response("resp_cart_add", 750, 300, status=201),
        _route("r_cart_get", 0, 500, "GET", "/cart/:id", "Get cart"),
        _auth("a_cart_get", 250, 500),
        _db("d_cart_get", 500, 500, "Cart", "findOne"),
        _response("resp_cart_get", 750, 500),
        _route("r_checkout", 0, 700, "POST", "/checkout", "Checkout"),
        _auth("a_checkout", 250, 700),
        _db("d_checkout", 500, 700, "Order", "create"),
        _response("resp_checkout", 750, 700, status=201),
    ],
    "edges": [
        _edge("e1", "r_products", "d_products"), _edge("e2", "d_products", "resp_products"),
        _edge("e3", "r_cart_add", "a_cart_add"), _edge("e4", "a_cart_add", "d_cart_add"), _edge("e5", "d_cart_add", "resp_cart_add"),
        _edge("e6", "r_cart_get", "a_cart_get"), _edge("e7", "a_cart_get", "d_cart_get"), _edge("e8", "d_cart_get", "resp_cart_get"),
        _edge("e9", "r_checkout", "a_checkout"), _edge("e10", "a_checkout", "d_checkout"), _edge("e11", "d_checkout", "resp_checkout"),
    ],
}

# ── Blog API (3 routes) ──────────────────────────────────────────────────────
_BLOG = {
    "version": "1.0.0",
    "nodes": [
        _route("r_posts", 0, 100, "GET", "/posts", "List posts"),
        _db("d_posts", 350, 100, "Post", "findAll"),
        _response("resp_posts", 700, 100),
        _route("r_post_create", 0, 300, "POST", "/posts", "Create post"),
        _auth("a_post_create", 250, 300),
        _db("d_post_create", 500, 300, "Post", "create"),
        _response("resp_post_create", 750, 300, status=201),
        _route("r_post_get", 0, 500, "GET", "/posts/:id", "Get post"),
        _db("d_post_get", 350, 500, "Post", "findOne"),
        _response("resp_post_get", 700, 500),
    ],
    "edges": [
        _edge("e1", "r_posts", "d_posts"), _edge("e2", "d_posts", "resp_posts"),
        _edge("e3", "r_post_create", "a_post_create"), _edge("e4", "a_post_create", "d_post_create"), _edge("e5", "d_post_create", "resp_post_create"),
        _edge("e6", "r_post_get", "d_post_get"), _edge("e7", "d_post_get", "resp_post_get"),
    ],
}


STARTER_BLUEPRINTS: dict[str, dict[str, Any]] = {
    "todo": _TODO,
    "cart": _CART,
    "blog": _BLOG,
}

VALID_TEMPLATE_KEYS = tuple(STARTER_BLUEPRINTS.keys())


def get(key: str | None) -> dict[str, Any]:
    """Return the starter blueprint for ``key`` (case-insensitive), or the empty canvas."""
    if not key:
        return {"version": "1.0.0", "nodes": [], "edges": []}
    return STARTER_BLUEPRINTS.get(key.lower(), {"version": "1.0.0", "nodes": [], "edges": []})

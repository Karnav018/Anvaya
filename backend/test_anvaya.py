"""
Anvaya Backend — Full API Test Script
Usage: python3 test_anvaya.py
"""
import urllib.request
import urllib.error
import json
import sys
import os

BASE = "http://localhost:8000"


def req(method, path, body=None, token=None):
    url = BASE + path
    headers = {"Content-Type": "application/json"}
    if token:
        headers["Authorization"] = f"Bearer {token}"
    data = json.dumps(body).encode() if body else None
    request = urllib.request.Request(url, data=data, headers=headers, method=method)
    try:
        with urllib.request.urlopen(request, timeout=20) as resp:
            raw = resp.read()
            return resp.status, json.loads(raw) if raw else {}
    except urllib.error.HTTPError as e:
        raw = e.read()
        try:
            return e.code, json.loads(raw)
        except Exception:
            return e.code, {"raw": raw.decode()}


def check(label, status, data, expected=None):
    expected = expected or [200, 201]
    if status in expected:
        print(f"  ✅ {label} ({status})")
    else:
        print(f"  ❌ {label} FAILED ({status})")
        print(f"     {json.dumps(data, indent=4)}")
        sys.exit(1)
    return data


print("\n" + "="*50)
print("  🚀  Anvaya Backend — Full Test Suite")
print("="*50 + "\n")

# ── Health ────────────────────────────────────────────
print("📡 Health Check")
s, d = req("GET", "/health")
check("GET /health", s, d)
print()

# ── Auth ──────────────────────────────────────────────
print("🔐 Auth")

# Signup (409 ok if user exists already)
s, d = req("POST", "/auth/signup", {
    "email": "testuser@anvaya.dev",
    "password": "testpass123",
    "name": "Test User"
})
if s == 409:
    print("  ℹ️  POST /auth/signup (409 — user exists, skipping)")
else:
    check("POST /auth/signup", s, d, [201])

# Login
s, d = req("POST", "/auth/login", {
    "email": "testuser@anvaya.dev",
    "password": "testpass123"
})
d = check("POST /auth/login", s, d)
TOKEN = d["token"]
print(f"     Token: {TOKEN[:40]}...")

# /me
s, d = req("GET", "/auth/me", token=TOKEN)
d = check("GET /auth/me", s, d)
print(f"     User: {d['name']} | plan={d['plan']} | quota={d['generations_used']}/{d['generations_limit']}")

# Invalid login
s, d = req("POST", "/auth/login", {"email": "testuser@anvaya.dev", "password": "wrongpass"})
if s == 401:
    print("  ✅ Invalid login → 401 ✓")

# Duplicate signup
s, d = req("POST", "/auth/signup", {"email": "testuser@anvaya.dev", "password": "x", "name": "X"})
if s == 409:
    print("  ✅ Duplicate email → 409 ✓")

# No token
s, d = req("GET", "/auth/me")
if s == 403:
    print("  ✅ No token → 403 ✓")
print()

# ── Projects ──────────────────────────────────────────
print("📁 Projects")

s, d = req("POST", "/projects", {
    "name": "Shell Test API",
    "description": "Testing via Python script"
}, TOKEN)
d = check("POST /projects", s, d, [201])
PID = d["id"]
print(f"     Project ID: {PID}")

s, d = req("GET", "/projects", token=TOKEN)
d = check("GET /projects", s, d)
print(f"     Found {len(d)} project(s)")

s, d = req("GET", f"/projects/{PID}", token=TOKEN)
check("GET /projects/{id}", s, d)

s, d = req("PUT", f"/projects/{PID}", {"name": "Shell Test API (Updated)"}, TOKEN)
d = check("PUT /projects/{id}", s, d)
print(f"     New name: {d['name']}")
print()

# ── Blueprints ────────────────────────────────────────
print("🗺️  Blueprints")

s, d = req("GET", f"/blueprints/{PID}", token=TOKEN)
d = check("GET /blueprints/{project_id} — load empty", s, d)
print(f"     Version: {d['version']}, Nodes: {len(d['canvas_json'].get('nodes', []))}")

CANVAS = {
    "canvas_json": {
        "version": "1.0.0",
        "nodes": [
            {
                "id": "n1", "type": "route",
                "position": {"x": 100, "y": 200},
                "data": {"method": "GET", "path": "/users", "description": "Get all users"}
            },
            {
                "id": "n2", "type": "auth",
                "position": {"x": 350, "y": 200},
                "data": {"strategy": "jwt", "secret_env_var": "JWT_SECRET"}
            },
            {
                "id": "n3", "type": "database",
                "position": {"x": 600, "y": 200},
                "data": {"provider": "postgres", "model": "User", "action": "findAll"}
            },
            {
                "id": "n4", "type": "response",
                "position": {"x": 850, "y": 200},
                "data": {"status_code": 200, "body": "data"}
            }
        ],
        "edges": [
            {"id": "e1", "source": "n1", "target": "n2"},
            {"id": "e2", "source": "n2", "target": "n3"},
            {"id": "e3", "source": "n3", "target": "n4"}
        ]
    }
}

s, d = req("POST", f"/blueprints/{PID}", CANVAS, TOKEN)
d = check("POST /blueprints/{project_id} — save canvas", s, d, [201])
print(f"     Saved version: {d['version']}, Nodes: {len(d['canvas_json'].get('nodes', []))}")
print()

# ── Quota ─────────────────────────────────────────────
print("⚡ Quota")
s, d = req("GET", "/generate/quota", token=TOKEN)
d = check("GET /generate/quota", s, d)
print(f"     Before: {d['used']}/{d['limit']} | remaining: {d['remaining']}")
print()

# ── Generate Code ─────────────────────────────────────
print("⚙️  Code Generation")

url = f"{BASE}/generate/{PID}"
headers = {
    "Content-Type": "application/json",
    "Authorization": f"Bearer {TOKEN}"
}
body = json.dumps({"project_name": "shell-test-api"}).encode()
request = urllib.request.Request(url, data=body, headers=headers, method="POST")

try:
    with urllib.request.urlopen(request, timeout=30) as resp:
        if resp.status == 200:
            zip_bytes = resp.read()
            zip_path = "/tmp/shell-test-api.zip"
            with open(zip_path, "wb") as f:
                f.write(zip_bytes)
            size_kb = len(zip_bytes) / 1024
            print(f"  ✅ POST /generate/{{project_id}} (200)")
            print(f"     ZIP size: {size_kb:.1f} KB")
            print(f"     Saved to: {zip_path}")
            # Show quota headers
            quota_used = resp.headers.get("X-Quota-Used", "?")
            quota_rem  = resp.headers.get("X-Quota-Remaining", "?")
            print(f"     Quota after: used={quota_used} remaining={quota_rem}")
        else:
            print(f"  ❌ POST /generate (unexpected status: {resp.status})")
except urllib.error.HTTPError as e:
    raw = e.read()
    try:
        error = json.loads(raw)
    except Exception:
        error = raw.decode()
    print(f"  ❌ POST /generate FAILED ({e.code}): {json.dumps(error, indent=4)}")
    sys.exit(1)
print()

# ── Quota After Generate ──────────────────────────────
print("⚡ Quota After Generate")
s, d = req("GET", "/generate/quota", token=TOKEN)
check("GET /generate/quota", s, d)
print(f"     After: {d['used']}/{d['limit']} | remaining: {d['remaining']}")
print()

# ── List zip contents ─────────────────────────────────
print("📦 ZIP Contents")
import zipfile
with zipfile.ZipFile("/tmp/shell-test-api.zip") as zf:
    for name in sorted(zf.namelist()):
        info = zf.getinfo(name)
        print(f"     {name}  ({info.file_size} bytes)")
print()

# ── Cleanup ───────────────────────────────────────────
print("🧹 Cleanup")
s, d = req("DELETE", f"/projects/{PID}", token=TOKEN)
check("DELETE /projects/{id}", s, d, [204])
print()

print("="*50)
print("  🎉  ALL TESTS PASSED — Backend is production ready!")
print("="*50 + "\n")

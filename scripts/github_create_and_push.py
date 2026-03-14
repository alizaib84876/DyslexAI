#!/usr/bin/env python3
"""
Create GitHub repo and push all code via GitHub API (no Git required).
Set GITHUB_TOKEN env var with a Personal Access Token from:
https://github.com/settings/tokens (scope: repo)
"""
import base64
import json
import os
import sys
from pathlib import Path

try:
    import requests
except ImportError:
    print("Installing requests...")
    os.system(f"{sys.executable} -m pip install requests -q")
    import requests

ROOT = Path(__file__).resolve().parents[1]
TOKEN = os.environ.get("GITHUB_TOKEN")
REPO_NAME = "dyslexai"

# Files/folders to skip (like .gitignore)
SKIP = {
    ".git", "venv", "node_modules", "__pycache__", ".pytest_cache",
    "dist", ".ipynb_checkpoints", "*.pyc", "*.db", "artifacts", "debug_outputs",
    "dyslexia-backend/venv", "dyslexia-backend/data",
    "batch_test_results.json", "tools/node-v24.11.0-win-x64.zip",
    "tools/PortableGit.exe", "tools/PortableGit", "tools/PortableGit",
}
# Skip .env but keep .env.example
ENV_SKIP = {"dyslexia-backend/.env", ".env"}

def should_skip(p: Path) -> bool:
    rel = str(p.relative_to(ROOT)).replace("\\", "/")
    if rel in ENV_SKIP or (rel.endswith("/.env") and not rel.endswith(".env.example")): return True
    for skip in SKIP:
        if skip.startswith("*"):
            if rel.endswith(skip[1:]): return True
        elif skip in rel or rel.startswith(skip): return True
    return False

def get_files():
    files = []
    for p in ROOT.rglob("*"):
        if p.is_file() and not should_skip(p):
            rel = p.relative_to(ROOT)
            files.append((rel, p))
    return files

def main():
    if not TOKEN:
        print("ERROR: Set GITHUB_TOKEN environment variable")
        print("Create token at: https://github.com/settings/tokens (scope: repo)")
        sys.exit(1)

    headers = {
        "Authorization": f"token {TOKEN}",
        "Accept": "application/vnd.github.v3+json",
    }

    # Get current user
    r = requests.get("https://api.github.com/user", headers=headers)
    if r.status_code != 200:
        print(f"Auth failed: {r.status_code} - {r.text[:200]}")
        sys.exit(1)
    user = r.json()["login"]
    print(f"Logged in as: {user}")

    # Create repo
    r = requests.post("https://api.github.com/user/repos", headers=headers, json={
        "name": REPO_NAME,
        "description": "Local-first OCR and adaptive exercises for dyslexic students",
        "private": False,
        "auto_init": False,
    })
    if r.status_code == 201:
        print(f"Created repo: github.com/{user}/{REPO_NAME}")
    elif r.status_code == 422 and "already exists" in r.text.lower():
        print(f"Repo already exists: github.com/{user}/{REPO_NAME}")
    else:
        print(f"Create repo failed: {r.status_code} - {r.text[:300]}")
        sys.exit(1)

    files = get_files()
    print(f"Uploading {len(files)} files...")

    # Create blobs and tree
    tree = []
    for rel, p in files:
        content = p.read_bytes()
        try:
            text = content.decode("utf-8")
            if "\x00" in text:
                content_b64 = base64.b64encode(content).decode()
            else:
                content_b64 = base64.b64encode(content).decode()
        except UnicodeDecodeError:
            content_b64 = base64.b64encode(content).decode()
        path_str = str(rel).replace("\\", "/")
        r = requests.post(f"https://api.github.com/repos/{user}/{REPO_NAME}/git/blobs",
            headers=headers, json={"content": content_b64, "encoding": "base64"})
        if r.status_code != 201:
            print(f"  Skip {path_str}: {r.status_code}")
            continue
        sha = r.json()["sha"]
        tree.append({"path": path_str, "mode": "100644", "type": "blob", "sha": sha})

    # Create tree
    r = requests.post(f"https://api.github.com/repos/{user}/{REPO_NAME}/git/trees",
        headers=headers, json={"tree": tree})
    if r.status_code != 201:
        print(f"Tree failed: {r.status_code} - {r.text[:300]}")
        sys.exit(1)
    tree_sha = r.json()["sha"]

    # Create commit
    r = requests.post(f"https://api.github.com/repos/{user}/{REPO_NAME}/git/commits",
        headers=headers, json={
            "message": "Initial commit: DyslexAI OCR and adaptive exercises",
            "tree": tree_sha,
        })
    if r.status_code != 201:
        print(f"Commit failed: {r.status_code} - {r.text[:300]}")
        sys.exit(1)
    commit_sha = r.json()["sha"]

    # Update ref
    r = requests.patch(f"https://api.github.com/repos/{user}/{REPO_NAME}/git/refs/heads/main",
        headers=headers, json={"sha": commit_sha})
    if r.status_code == 404:
        r = requests.post(f"https://api.github.com/repos/{user}/{REPO_NAME}/git/refs",
            headers=headers, json={"ref": "refs/heads/main", "sha": commit_sha})
    if r.status_code not in (200, 201):
        print(f"Ref failed: {r.status_code} - {r.text[:300]}")
        sys.exit(1)

    print(f"\nDone! https://github.com/{user}/{REPO_NAME}")

if __name__ == "__main__":
    main()

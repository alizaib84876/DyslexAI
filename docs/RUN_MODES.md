# Run Modes

## run-simple.ps1 (Recommended for Most Users)

**Use when:** Docker/PostgreSQL is unavailable or you want the fastest path.

```powershell
.\scripts\run-simple.ps1
```

- **Database:** SQLite (`dyslexia.db` in dyslexia-backend)
- **OCR mode:** `notebook_parity`
- **Seeding:** Runs `db/seed.py` before backend start
- **Backend:** Port 8000
- **Frontend:** Port 5173
- **All features work:** Dashboard, Workspace, History, Exercises, Game Mode

---

## run.ps1 (Full Stack with PostgreSQL)

**Use when:** Docker is available and you want PostgreSQL.

```powershell
.\scripts\run.ps1
```

- **Database:** PostgreSQL (Docker container `dyslexia-db`)
- **OCR mode:** `notebook_parity`
- **Requires:** `.\scripts\setup.ps1` run first with Docker
- **Backend:** Port 8000
- **Frontend:** Port 5173

---

## SQLite vs PostgreSQL

| Mode | Database | When to Use |
|------|----------|-------------|
| run-simple.ps1 | SQLite | No Docker, quick start, local dev |
| run.ps1 | PostgreSQL | Docker available, production-like |

Both support the same features. SQLite is sufficient for demo and development.

---

## OCR Mode Environment Variables

| Variable | Values | Default |
|----------|--------|---------|
| `OCR_MODE` | `notebook_parity`, `production` | `notebook_parity` |
| `TROCR_FAST` | `0` (TrOCR-large), `1` (TrOCR-base) | `0` in run.ps1, `1` in run-simple.ps1 |
| `QUALITY_MODE` | `quality_local`, `fast_local`, `cloud_refine` | `quality_local` |
| `TROCR_WORKERS` | 1–6 | 2 (run.ps1), 4 (config default) |

**notebook_parity** is the verified default; matches research notebook outputs.

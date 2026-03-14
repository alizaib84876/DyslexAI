# Auth Hardening Migration

## Overview

This migration adds `user_id` to `ocr_runs` for per-user ownership. Run it **before** starting the server after pulling auth hardening changes.

## Run Migration

From `dyslexia-backend/`:

```bash
python scripts/migrate_add_user_id_to_ocr_runs.py
```

The server also runs this migration automatically on startup.

## What It Does

- Ensures `users` table exists (creates if missing)
- Adds `user_id` column to `ocr_runs` if missing
- Creates index on `ocr_runs.user_id`

## Legacy Data

Runs created before this migration have `user_id = NULL` and are excluded from user-scoped queries (history, dashboard). New runs require authentication and are assigned to the logged-in user.

## SQLite

The migration script supports SQLite out of the box. It uses `ALTER TABLE` and `CREATE INDEX`.

## PostgreSQL

For PostgreSQL, run equivalent SQL manually:

```sql
ALTER TABLE ocr_runs ADD COLUMN IF NOT EXISTS user_id INTEGER REFERENCES users(id);
CREATE INDEX IF NOT EXISTS ix_ocr_runs_user_id ON ocr_runs(user_id);
```

If your PostgreSQL version does not support `ADD COLUMN IF NOT EXISTS`, use:

```sql
-- Check if column exists first, then:
ALTER TABLE ocr_runs ADD COLUMN user_id INTEGER REFERENCES users(id);
CREATE INDEX IF NOT EXISTS ix_ocr_runs_user_id ON ocr_runs(user_id);
```

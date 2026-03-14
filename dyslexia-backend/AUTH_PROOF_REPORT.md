# Auth Proof Report

## Script

`scripts/auth_proof.py` — automated verification of DyslexAI auth enforcement.

## Usage

```bash
cd dyslexia-backend
python scripts/auth_proof.py
```

Optional: save report to a custom path:

```bash
AUTH_PROOF_OUTPUT=reports/auth_$(date +%Y%m%d).json python scripts/auth_proof.py
```

## What It Tests

| Test | Description |
|------|--------------|
| signup_user_a, signup_user_b | Create two users |
| unauth_401_* | Unauthenticated requests to protected endpoints return 401 |
| auth_dashboard_overview | Authenticated GET /api/dashboard/overview -> 200 |
| auth_dashboard_history | Authenticated GET /api/dashboard/history -> 200 |
| auth_me | Authenticated GET /api/auth/me -> 200 |
| auth_students_list | Authenticated GET /students/ -> 200 |
| auth_exercises_next | Authenticated GET /exercises/next -> 200 or 404 |
| auth_sessions_create | Authenticated POST /sessions/ -> 200 |
| auth_ocr_process | Authenticated POST /api/ocr/process -> 200 |
| unauth_ocr_process_401 | Unauthenticated POST /api/ocr/process -> 401 |
| ownership_history_scoped | User A sees own run in history; User B does not |
| ownership_review_404 | User B cannot review User A's run -> 404 |
| ownership_review_own_200 | User A can review own run -> 200 |

## Report Format

The script writes a JSON report (default: `auth_proof_report.json`):

```json
{
  "timestamp": "2026-03-14T14:47:30Z",
  "tests": [...],
  "passed": 18,
  "failed": 0,
  "skipped": 0,
  "summary": "passed=18 failed=0 skipped=0"
}
```

## Frontend Session Behavior (Code-Verified)

| Behavior | Implementation |
|----------|----------------|
| Token persists on refresh | `localStorage` (auth.ts `TOKEN_KEY`) |
| Invalid token triggers logout | `refreshUser` calls `fetchMe`; on error clears token and sets unauthenticated |
| 401/403 triggers logout + redirect | `handleUnauthorized()` clears token, dispatches `auth:unauthorized`; AuthContext listens and navigates to `/login` |
| Protected pages redirect to /login | `ProtectedRoute` checks `authenticated`, redirects when false |
| Login redirects to dashboard | `AuthContext.login` navigates to `/dashboard` after success |
| Logout clears token | `clearToken()` removes `TOKEN_KEY` and `USER_KEY` from localStorage |

## Latest Run (2026-03-14)

All 18 tests passed. See `auth_proof_report.json` for full output.

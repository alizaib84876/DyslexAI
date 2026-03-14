# Data Ownership Model

## Per-User (Scoped)

| Resource | Ownership | Notes |
|----------|-----------|-------|
| **OCRRun** | `user_id` FK | Each OCR run belongs to the user who created it. History and dashboard show only the current user's runs. Review endpoint returns 404 when run belongs to another user (hidden existence). |

## Shared (System-Wide)

| Resource | Scope | Notes |
|----------|-------|-------|
| **Student** | Shared | Students are shared across all users. Multiple educators can view/manage the same student pool. |
| **Exercise** | Shared | Exercises are shared. |
| **Session** | Shared | Exercise sessions are shared (tied to students). |
| **WordMastery** | Shared | Word mastery is per-student, not per-user. |

## HTTP Status Semantics

| Status | When |
|--------|------|
| **401** | Missing or invalid JWT. Client must re-authenticate. |
| **403** | Authenticated but forbidden (e.g. wrong role). Rare in current design. |
| **404** | Resource not found, or resource exists but belongs to another user (hidden existence). Used for OCR review when run_id belongs to another user to avoid leaking existence. |

## Migration Note

OCR runs created before auth hardening have `user_id = NULL` and are excluded from user-scoped queries. New runs require authentication and are assigned to the logged-in user.

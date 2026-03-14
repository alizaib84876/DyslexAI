# Shared vs Per-User Data Model

## Current State (Demo-Ready)

| Resource | Scope | Rationale |
|----------|-------|-----------|
| **OCRRun** | Per-user | Each run belongs to the user who created it. History and dashboard scoped. |
| **Student** | Shared | All educators see the same student pool. Acceptable for demo: single classroom or shared lab. |
| **Exercise** | Shared | Seeded exercises are global. Acceptable for demo: exercises are content, not user data. |
| **Session** | Shared | Sessions are tied to students. Acceptable for demo: students are shared. |
| **WordMastery** | Shared | Per-student, not per-user. Acceptable for demo: follows student scope. |

## Why Shared Is Acceptable for Demo

1. **Single-tenant demo**: Typical demo is one teacher, one classroom. Students are "our" students.
2. **No multi-tenant requirement**: We are not targeting multiple schools/orgs in the same DB yet.
3. **Minimal migration**: Per-user students would require `user_id` on Student, scoping all student-related queries, and UI changes. Not justified for demo scope.

## Future: Per-User Students (Migration Plan)

If multi-tenant or per-teacher students are needed:

1. Add `user_id` (nullable) to `Student`.
2. Migration: set `user_id = NULL` for existing rows (or assign to a default user).
3. Scope `GET /students/` to `WHERE user_id = :current_user_id OR user_id IS NULL` (or strict).
4. Scope `POST /students/` to set `user_id = current_user.id`.
5. Update dashboard student progress to filter by user-owned students.
6. Frontend: no change if backend returns scoped list.

**Estimated effort**: 2–4 hours. No implementation in this pass.

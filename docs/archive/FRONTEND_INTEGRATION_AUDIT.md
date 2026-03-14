# Frontend + Integration Audit Report

**Date:** 2025-03-13  
**Design source of truth:** WEB_APP_DESIGN_SPEC.md, colors.ts, index.ts  
**Backend repo:** https://github.com/alizaib84876/dyslexia-backend.git

---

## A. Active Runtime Truth

### 1. Frontend folder active at runtime
**Path:** `c:\Users\abuba\OneDrive\Desktop\New folder\frontend\`  
**Entry:** `frontend/index.html` → `frontend/src/main.tsx`  
**Proof:** `index.html` line 13: `<script type="module" src="/src/main.tsx"></script>`

### 2. Backend folder active at runtime
**Path:** `c:\Users\abuba\OneDrive\Desktop\New folder\dyslexia-backend\`  
**Entry:** `dyslexia-backend/app/main.py`  
**Proof:** `scripts/run.ps1` line 43: `cd '$ExercisesBackend'; & '$py' -m uvicorn app.main:app --reload --host 0.0.0.0 --port 8000`

### 3. Run scripts that start them
| Script | Frontend | Backend | Notes |
|--------|----------|---------|-------|
| `scripts/run.ps1` | `npm run dev` (port 5173) | `uvicorn app.main:app --port 8000` | Full stack, VITE_API_BASE_URL=http://localhost:8000/api |
| `scripts/run-simple.ps1` | `npm run dev` (port 5173) | Same backend, SQLite | Same env vars |

### 4. Routes/endpoints actually used by frontend

**From `frontend/src/lib/api.ts`:**

| Frontend API call | Backend endpoint | Method | Used by |
|-------------------|-----------------|--------|---------|
| `fetchOverview()` | `/api/dashboard/overview` | GET | DashboardPage |
| `fetchHistory()` | `/api/dashboard/history` | GET | DashboardPage, HistoryPage |
| `fetchStudentProgress()` | `/api/dashboard/students/progress` | GET | DashboardPage, StudentPage |
| `submitReview(runId, payload)` | `/api/ocr/{run_id}/review` | POST | DashboardPage, HistoryPage |
| `processImage(payload)` | `/api/ocr/process` | POST | WorkspacePage |
| `fetchExerciseStudents()` | `/students/` | GET | WorkspacePage, ExercisesPage, GamifiedExercisePage, StudentPage |
| `createExerciseStudent(payload)` | `/students/` | POST | ExercisesPage, GamifiedExercisePage, StudentPage |
| `getNextExercise(studentId, type?)` | `/exercises/next?student_id=...` | GET | ExercisesPage, GamifiedExercisePage |
| `createSession(payload)` | `/sessions/` | POST | ExercisesPage, GamifiedExercisePage |
| `submitTyping(sessionId, payload)` | `/sessions/{id}/submit` | POST | ExercisesPage, GamifiedExercisePage |
| `submitHandwriting(sessionId, file)` | `/sessions/{id}/submit-handwriting` | POST | ExercisesPage, GamifiedExercisePage |
| `submitTracing(sessionId, payload)` | `/sessions/{id}/submit-tracing` | POST | ExercisesPage, GamifiedExercisePage |

**Dead API (never imported):**
- `fetchStudents()` → would call `/api/students/` (404 – backend has `/students/` only)
- `createStudent()` → would call `/api/students/` (404)

---

## B. Frontend File-Truth Audit

| File | Classification | Imported | Imported from | Rendered at runtime | Changed from original | Why |
|------|----------------|----------|---------------|---------------------|----------------------|-----|
| `src/main.tsx` | USED AS-IS | Yes | index.html | Yes | N/A | Entry point |
| `src/App.tsx` | MODIFIED AND USED | Yes | main.tsx | Yes | Custom nav, no Landing/Signup/Login/Library/Settings/About/Help/Privacy/Terms | Old teacher-portal layout kept |
| `src/styles.css` | MODIFIED AND USED | Yes | main.tsx | Yes | :root has spec tokens; hero/buttons/cards use #2563eb, #3b82f6 (wrong) | Partial spec adoption, rest hardcoded |
| `src/theme/colors.ts` | NOT USED | No | — | No | Matches spec exactly | Never imported anywhere |
| `src/theme/index.ts` | NOT USED | No | — | No | Matches spec (spacing, radius, fonts) | Never imported anywhere |
| `src/lib/api.ts` | MODIFIED AND USED | Yes | All pages | Yes | fetchStudents/createStudent dead; EXERCISES_BASE vs API_BASE split | Backend route split |
| `src/lib/diff.ts` | USED AS-IS | Yes | CorrectionHighlights | Yes | N/A | — |
| `src/types.ts` | USED AS-IS | Yes | api.ts, pages, components | Yes | N/A | — |
| `src/pages/DashboardPage.tsx` | MODIFIED AND USED | Yes | App.tsx | Yes | Teacher review portal, not user greeting/quick tools | Old design |
| `src/pages/ExercisesPage.tsx` | MODIFIED AND USED | Yes | App.tsx | Yes | Adaptive exercises, not module list | Old design |
| `src/pages/GamifiedExercisePage.tsx` | MODIFIED AND USED | Yes | App.tsx | Yes | Game mode with XP/streak; uses #2563eb/#3b82f6 | Old design, wrong colors |
| `src/pages/WorkspacePage.tsx` | MODIFIED AND USED | Yes | App.tsx | Yes | Upload + scan results | Old design |
| `src/pages/HistoryPage.tsx` | MODIFIED AND USED | Yes | App.tsx | Yes | OCR history list | Old design |
| `src/pages/StudentPage.tsx` | MODIFIED AND USED | Yes | App.tsx | Yes | Student management | Old design |
| `src/components/UploadPanel.tsx` | USED AS-IS | Yes | WorkspacePage | Yes | N/A | — |
| `src/components/ComparisonViewer.tsx` | USED AS-IS | Yes | WorkspacePage | Yes | N/A | — |
| `src/components/CorrectionHighlights.tsx` | PARTIALLY USED | Yes | WorkspacePage | Yes | Uses flow-text-corrected; no #fff59d in CSS | Missing corrected highlight style |
| `src/components/AnnotatedImageViewer.tsx` | USED AS-IS | Yes | WorkspacePage | Yes | N/A | — |
| `src/components/PipelineInsights.tsx` | USED AS-IS | Yes | WorkspacePage | Yes | N/A | — |
| `src/components/MetricsCards.tsx` | USED AS-IS | Yes | DashboardPage | Yes | N/A | — |
| `src/components/PerformanceChart.tsx` | MODIFIED AND USED | Yes | DashboardPage | Yes | Hardcoded #3b82f6, #2563eb | Wrong primary |
| `src/components/HandwritingSessionResult.tsx` | USED AS-IS | Yes | ExercisesPage | Yes | N/A | — |
| `src/components/TracingCanvas.tsx` | MODIFIED AND USED | Yes | ExercisesPage, GamifiedExercisePage | Yes | Hardcoded #3b82f6 | Wrong primary |
| `frontend/dist/*` | DEAD/LEGACY | No (dev uses src) | — | No (preview uses stale build) | Inter/Segoe UI, dark theme | Old build, not from current src |

---

## C. Design-Spec Compliance Audit

### 1. Theme tokens

| Token | Spec | Actual | File | Proof |
|-------|------|--------|------|-------|
| primary | #308ce8 | #308ce8 in :root only | styles.css:8 | `--color-primary: #308ce8` |
| primary | #308ce8 | #2563eb, #3b82f6, #1e40af | styles.css | hero (128), primary-button (273), .small-button.approve (409), .gx-* (639, 676, 688, 706, 811, 824, 869, 898, 959, 1070), PerformanceChart, TracingCanvas |
| primaryLight | #5ba3ef | Not used | — | — |
| primaryDark | #1a6bb8 | Not used | — | — |
| background | #f5f5f5 | #f5f5f5 | styles.css:11, :root | ✓ |
| surface | #ffffff | #ffffff | styles.css:12 | ✓ |
| surfaceElevated | #fafafa | #fafafa (fallback only) | styles.css:97 | `var(--color-surface-elevated, #fafafa)` – var not defined in :root |
| semantic colors | success/warning/error | Correct in :root | styles.css:17-19 | ✓ |
| corrected | #fff59d | #fff59d in :root | styles.css:20 | ✓ |
| corrected highlight | #fff59d | NOT applied to corrected text | — | .flow-text-corrected has no background; .text-panel-corrected uses #f0fdfa/#99f6e4 (teal) |

### 2. Typography

| Check | Result | File | Proof |
|-------|--------|------|-------|
| Lexend used | Yes | index.html:9, styles.css:3 | `<link href="https://fonts.googleapis.com/css2?family=Lexend:wght@400;500;600;700&display=swap" />`, `font-family: 'Lexend', sans-serif` |
| Weights 400/500/600/700 | Partial | styles.css | 400, 500, 600, 700 used; theme/index.ts fonts not imported |
| Sizes (24–32 titles, 16–18 headings, 14–16 body) | Partial | styles.css | Mixed; hero 42px, card-header varies |

### 3. Spacing and radius

| Token | Spec | Actual | Proof |
|-------|------|--------|-------|
| xs/sm/md/lg/xl | 4/8/16/24/32 | Not in CSS vars | styles.css has no --spacing-*; theme/index.ts not used |
| radius sm/md/lg/full | 8/12/16/9999 | Mixed hardcoded | 6, 8, 10, 12, 14, 16, 18, 20, 24, 32, 50, 999, 9999 used |
| Cards border-radius | 12px (md) | 24px, 20px, 16px, 32px | styles.css:122, 298, 779 |

### 4. UI patterns

| Pattern | Spec | Actual | Proof |
|---------|------|--------|-------|
| Cards | White #ffffff, radius 12px | #ffffff, radius 24px/20px/16px | styles.css:119-124, 188-190 |
| Primary buttons | #308ce8, semiBold, 12px radius | #2563eb, 12px radius | styles.css:268-278 |
| Inputs | White, border #e0e0e0, focus primary | Border #cbd5e1, focus #3b82f6 | styles.css:250-267 |
| Icons | Material Icons, primary | Not used (no icon library) | — |
| Corrected text | #fff59d highlight | .flow-text-corrected undefined; .text-panel-corrected teal | CorrectionHighlights uses flow-text-corrected; no CSS for it |

---

## D. Route/Page Audit

| Route | Page component | Child components | Matches design | Backend API | Status |
|-------|----------------|-----------------|----------------|-------------|--------|
| `/` | DashboardPage | MetricsCards, PerformanceChart | No – teacher portal, not user greeting/quick tools | /api/dashboard/overview, /history, /students/progress | WORKING |
| `/exercises` | ExercisesPage | HandwritingSessionResult, TracingCanvas | No – adaptive list, not module cards | /students/, /exercises/next, /sessions/* | WORKING |
| `/game` | GamifiedExercisePage | TracingCanvas | No – game mode, wrong colors | Same as exercises | WORKING |
| `/workspace` | WorkspacePage | UploadPanel, PipelineInsights, AnnotatedImageViewer, ComparisonViewer, CorrectionHighlights | No – teacher OCR studio | /students/, /api/ocr/process | WORKING |
| `/students` | StudentPage | — | No – management, not in spec as “Student Progress” | /students/, /api/dashboard/students/progress | WORKING |
| `/history` | HistoryPage | — | No – OCR history | /api/dashboard/history, /api/ocr/{id}/review | WORKING |
| **Landing** | — | — | **MISSING** | — | **MISSING** |
| **Signup** | — | — | **MISSING** | — | **MISSING** |
| **Login** | — | — | **MISSING** | — | **MISSING** |
| **Library** | — | — | **MISSING** | — | **MISSING** |
| **Settings** | — | — | **MISSING** | — | **MISSING** |
| **About** | — | — | **MISSING** | — | **MISSING** |
| **Help** | — | — | **MISSING** | — | **MISSING** |
| **Privacy** | — | — | **MISSING** | — | **MISSING** |
| **Terms** | — | — | **MISSING** | — | **MISSING** |
| Navbar/sidebar | App.tsx inline | — | Partial – sidebar exists, wrong colors | — | WORKING |

---

## E. Component Audit

| Component | File | Import chain | Actually used | Follows design |
|-----------|------|--------------|--------------|----------------|
| App shell/layout | App.tsx | main.tsx → App | Yes | Partial – sidebar, wrong primary |
| Navbar/sidebar | App.tsx (.sidebar, .nav-list) | Inline in App | Yes | Partial |
| Dashboard cards | MetricsCards, PerformanceChart | DashboardPage | Yes | No – wrong colors |
| Upload panel | UploadPanel.tsx | WorkspacePage | Yes | Partial – wrong focus/primary |
| Scan result panel | ComparisonViewer, CorrectionHighlights | WorkspacePage | Yes | No – corrected not #fff59d |
| Correction layers panel | ComparisonViewer | WorkspacePage | Yes | No |
| History table/list | HistoryPage, DashboardPage | App routes | Yes | No – wrong button colors |
| Exercises cards | ExercisesPage | App | Yes | No |
| Practice widgets | GamifiedExercisePage, TracingCanvas | ExercisesPage, GamifiedExercisePage | Yes | No – #3b82f6 |
| Settings menu | — | — | **MISSING** | — |
| About/Help/Legal | — | — | **MISSING** | — |
| Modals/forms/buttons | Various | Pages | Yes | No – primary #2563eb |

---

## F. Exact Modifications

### Created
- `frontend/src/theme/colors.ts` – matches spec, **never imported**
- `frontend/src/theme/index.ts` – matches spec, **never imported**

### Modified
- `frontend/src/styles.css`: :root tokens added (lines 1–21); hero/buttons/cards still use #2563eb, #3b82f6, #1e40af
- `frontend/src/App.tsx`: Routes for Dashboard, Exercises, Game, Workspace, Students, History; no Landing, Auth, Library, Settings, About, Help, Privacy, Terms
- `frontend/index.html`: Lexend font link added

### Deleted
- None identified (no git history in scope)

### Untouched (old code kept)
- All page components (DashboardPage, ExercisesPage, etc.) – teacher-portal structure
- GamifiedExercisePage – full gx-* styling with #2563eb/#3b82f6
- PerformanceChart – #3b82f6, #2563eb
- TracingCanvas – #3b82f6
- fetchStudents, createStudent in api.ts – dead, never imported

### Mock data
- None; all data from backend

### Placeholders
- UploadPanel: fast_local uses DocTR + TrOCR-base (fixed in cleanup)

---

## G. Dead Code Audit

| Item | Type | Location | Proof |
|------|------|----------|-------|
| fetchStudents | Unused export | api.ts:63 | Grep: no imports |
| createStudent | Unused export | api.ts:67 | Grep: no imports |
| theme/colors.ts | Unused file | src/theme/ | No imports |
| theme/index.ts | Unused file | src/theme/ | No imports |
| frontend/dist/ | Stale build | dist/ | Different CSS (Inter, dark theme); dev uses src |
| Student type (id: number) | Unused type | types.ts | fetchStudents uses it; fetchStudents dead |
| .flow-text, .flow-text-corrected | Undefined CSS classes | CorrectionHighlights.tsx | Used but not in styles.css |
| .line-list, .line-card, .correction-flow, .flow-step | Undefined CSS classes | CorrectionHighlights, StudentPage | Used but not in styles.css |

---

## H. Backend Integration Audit

### OCR process
- **Endpoint:** POST `/api/ocr/process`
- **Request:** FormData (file, quality_mode, student_id?, reference_text?)
- **Response:** run_id, raw_text, corrected_text, lines, correction_layer1/2/3, original_image_url, etc.
- **UI expects:** OCRRun (run_id, raw_text, corrected_text, lines, correction_layer1/2/3, original_image_path/url)
- **Backend returns:** All fields present. ✓

### Dashboard overview
- **Endpoint:** GET `/api/dashboard/overview`
- **Response:** total_students, total_uploads, total_runs, avg_confidence, avg_correction_ratio
- **UI expects:** DashboardOverview – same fields ✓

### History
- **Endpoint:** GET `/api/dashboard/history`
- **Response:** run_id, student_id, student_name (null), created_at, quality_mode, raw_text, corrected_text, avg_confidence, suspicious_lines, review_status, reviewed_text
- **UI expects:** HistoryItem – same fields ✓

### Student progress
- **Endpoint:** GET `/api/dashboard/students/progress`
- **Response:** student_id (UUID string), student_name, total_runs, avg_confidence (0), avg_correction_ratio (0)
- **UI expects:** StudentProgress with student_id (typed number) – type mismatch but String() used in find ✓

### Exercises
- **Endpoints:** GET `/exercises/next`, POST `/sessions/`, POST `/sessions/{id}/submit`, submit-handwriting, submit-tracing
- **UI expects:** Exercise, SessionCreate, SubmitResponse, HandwritingSubmitResponse
- **Backend returns:** Matching shapes ✓

### Auth
- **Endpoints:** None
- **UI:** No auth flows

### Library / saved scans
- **Endpoints:** None
- **UI:** No Library page

---

## I. Repo Integration Verdicts

| Integration | Verdict | Evidence |
|-------------|---------|----------|
| **1. Backend repo** | **FULL** | dyslexia-backend is the only backend. OCR, dashboard, history, exercises, sessions all served from it. Frontend calls correct routes. |
| **2. Gamified exercises** | **FULL** | GamifiedExercisePage uses getNextExercise, createSession, submitTyping/Handwriting/Tracing. XP, streak, level-up, confetti implemented. |
| **3. Frontend design/files** | **PARTIAL** | colors.ts and index.ts match spec but are never imported. styles.css has :root tokens; hero, buttons, cards, gamified page use #2563eb/#3b82f6. Landing, Signup, Login, Library, Settings, About, Help, Privacy, Terms missing. Corrected highlight #fff59d not applied. |

---

## J. Final Verdict

**PARTIALLY USED MY FRONTEND FILES AND DESIGN**

### Exact remaining fixes

| File | Issue | How to fix |
|------|-------|------------|
| `frontend/src/App.tsx` | No Landing, Signup, Login, Library, Settings, About, Help, Privacy, Terms | Add routes and page components per spec |
| `frontend/src/styles.css` | Hero, primary-button, .small-button.approve, .gx-* use #2563eb/#3b82f6 | Replace with var(--color-primary) or #308ce8 |
| `frontend/src/styles.css` | .text-panel-corrected uses teal; .flow-text-corrected undefined | Add .flow-text-corrected { background: var(--color-corrected); } and fix .text-panel-corrected to use #fff59d |
| `frontend/src/styles.css` | No --spacing-*, --radius-*, --color-surface-elevated | Add from spec to :root |
| `frontend/src/theme/colors.ts` | Never imported | Import in App or styles, use for inline styles / CSS-in-JS |
| `frontend/src/theme/index.ts` | Never imported | Same as above |
| `frontend/src/components/PerformanceChart.tsx` | Hardcoded #3b82f6, #2563eb | Use #308ce8 or var(--color-primary) |
| `frontend/src/components/TracingCanvas.tsx` | Hardcoded #3b82f6 | Use #308ce8 |
| `frontend/src/lib/api.ts` | fetchStudents, createStudent dead | Remove or wire to correct backend |
| `frontend/src/components/CorrectionHighlights.tsx` | Uses .line-list, .line-card, .correction-flow, .flow-step | Add these classes to styles.css or use existing card styles |
| `frontend/dist/` | Stale build (Inter, dark theme) | Run `npm run build` to refresh |

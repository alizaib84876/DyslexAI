# DyslexAI Demo Flow

## Prerequisites

- Backend running: `.\scripts\run.ps1` (or `.\scripts\run-simple.ps1`)
- Frontend: http://localhost:5173
- Backend: http://localhost:8000

---

## 1. Signup

1. Open http://localhost:5173
2. Click **Sign up**
3. Enter name, email, password (min 6 chars)
4. Submit
5. **Result:** Auto-login, redirect to dashboard

---

## 2. Login

1. If logged out, go to http://localhost:5173/login
2. Enter email and password
3. Submit
4. **Result:** Redirect to dashboard (or to the page you were trying to access)

---

## 3. Upload OCR Image

1. Go to **Workspace** (or **Dashboard** → upload)
2. Select a student (or leave **Unassigned**)
3. Choose **Quality (local)** for best handwriting
4. Pick an image (PNG, JPG, etc.)
5. Click **Process Document**
6. **Result:** OCR runs (30–90 sec), corrected text and line-by-line view appear

---

## 4. Review Result

1. In **Workspace**, review raw vs corrected text
2. Optionally approve or edit in the inline editor
3. In **Dashboard** or **History**, use Approve / Edit / Reject
4. **Result:** Review status saved; dashboard stats update

---

## 5. History

1. Go to **History**
2. See recent OCR runs (only your own)
3. Filter by status, student
4. **Result:** User-scoped list of runs

---

## 6. Dashboard

1. Go to **Dashboard**
2. See metrics: total uploads, avg confidence, correction ratio
3. View performance chart
4. Review recent runs
5. **Result:** All data scoped to current user

---

## 7. Exercises / Game Flow

1. Go to **Exercises** or **Game Mode**
2. Create or select a student
3. Choose exercise type: word typing, sentence typing, handwriting, tracing
4. Complete the exercise
5. **Result:** Score, feedback, word mastery updated
6. Repeat for adaptive practice

---

## Quick Path (5 min)

1. Signup → login
2. Dashboard (verify overview)
3. Workspace → upload one image → wait for processing
4. Exercises → create student → do one typing exercise

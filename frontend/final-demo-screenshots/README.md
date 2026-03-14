# Final Demo Screenshots

Capture these screenshots for FYP submission. Use a browser at 1920×1080 or similar.

## Missing Files Checklist

**Status:** All 10 screenshots must be captured manually. None are auto-generated.

| File | Exists | Path | Description |
|------|--------|------|-------------|
| 01-landing.png | ⬜ | `/` | Landing page before login |
| 02-signup.png | ⬜ | `/signup` | Signup form |
| 03-login.png | ⬜ | `/login` | Login form |
| 04-dashboard.png | ⬜ | `/dashboard` | Dashboard with metrics, chart, history |
| 05-workspace-upload.png | ⬜ | `/workspace` | Workspace upload panel before processing |
| 06-ocr-result.png | ⬜ | `/workspace` | OCR result with raw/corrected text and layers |
| 07-history.png | ⬜ | `/history` | History list with runs |
| 08-exercises.png | ⬜ | `/exercises` | Exercises page with student picker |
| 09-game-mode.png | ⬜ | `/game` | Game mode or typing/handwriting exercise |
| 10-settings.png | ⬜ | `/settings` | Settings page, or sidebar with user info |

## Exact Capture Steps

1. **Start app:** `.\scripts\run.ps1` (or `.\scripts\run-simple.ps1`)
2. **Create user:** Go to http://localhost:5173/signup, sign up with any email/password (min 6 chars)
3. **Upload OCR:** Go to Workspace, select image, click Process Document, wait for result
4. **Capture in order:**
   - `01-landing.png` — Before login: http://localhost:5173/
   - `02-signup.png` — http://localhost:5173/signup
   - `03-login.png` — http://localhost:5173/login (or after logout)
   - `04-dashboard.png` — After login: http://localhost:5173/dashboard
   - `05-workspace-upload.png` — Workspace before/without processed image
   - `06-ocr-result.png` — Workspace after OCR shows raw/corrected text
   - `07-history.png` — http://localhost:5173/history
   - `08-exercises.png` — http://localhost:5173/exercises
   - `09-game-mode.png` — http://localhost:5173/game (or mid-exercise)
   - `10-settings.png` — http://localhost:5173/settings
5. **Save:** PNG format, in this folder (`frontend/final-demo-screenshots/`)

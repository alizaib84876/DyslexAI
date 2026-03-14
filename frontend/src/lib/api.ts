import type {
  DashboardOverview,
  Exercise,
  ExerciseStudent,
  HandwritingSubmitResponse,
  HistoryItem,
  OCRRun,
  StudentProgress
} from "../types";
import { authHeaders, clearToken } from "./auth";

const API_BASE = import.meta.env.VITE_API_BASE_URL ?? "http://localhost:8000/api";

/** Call when 401/403 received — clears auth and notifies listeners to redirect. */
function handleUnauthorized(): void {
  clearToken();
  window.dispatchEvent(new CustomEvent("auth:unauthorized"));
}
const SERVER_ROOT = API_BASE.replace(/\/api$/, "");
/** Base URL for dyslexia-backend (exercises, sessions). Defaults to same host on port 8000. */
const EXERCISES_BASE = import.meta.env.VITE_EXERCISES_API ?? import.meta.env.VITE_SESSIONS_API ?? "http://localhost:8000";

async function parseJson<T>(response: Response): Promise<T> {
  if (response.status === 401 || response.status === 403) {
    handleUnauthorized();
  }
  if (!response.ok) {
    const message = await response.text();
    let detail = message;
    try {
      const obj = JSON.parse(message);
      if (obj.detail) detail = typeof obj.detail === "string" ? obj.detail : JSON.stringify(obj.detail);
    } catch {
      /* use raw message */
    }
    throw new Error(detail || "Request failed");
  }
  return (await response.json()) as T;
}

function fetchWithAuth(url: string, init?: RequestInit): Promise<Response> {
  const headers = new Headers(init?.headers);
  Object.entries(authHeaders()).forEach(([k, v]) => headers.set(k, v));
  return fetch(url, { ...init, headers });
}

// ── Auth API ────────────────────────────────────────────────────────────────

export interface AuthResponse {
  access_token: string;
  token_type: string;
  user: { id: number; name: string; email: string; created_at: string };
}

export async function signup(payload: {
  name: string;
  email: string;
  password: string;
}): Promise<AuthResponse> {
  return parseJson(
    await fetch(`${API_BASE}/auth/signup`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload)
    })
  );
}

export async function login(payload: { email: string; password: string }): Promise<AuthResponse> {
  return parseJson(
    await fetch(`${API_BASE}/auth/login`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload)
    })
  );
}

export async function fetchMe(): Promise<{ id: number; name: string; email: string; created_at: string }> {
  return parseJson(await fetchWithAuth(`${API_BASE}/auth/me`));
}

export async function logout(): Promise<{ message: string }> {
  return parseJson(
    await fetchWithAuth(`${API_BASE}/auth/logout`, { method: "POST" })
  );
}

/** Build full URL for an asset. Prefer urlPath when provided (e.g. /data/... or /api/ocr/original/123). */
export function toAssetUrl(
  filePath?: string | null,
  urlPath?: string | null
): string | null {
  if (urlPath && (urlPath.startsWith("/data/") || urlPath.startsWith("/api/"))) {
    return `${SERVER_ROOT}${urlPath}`;
  }
  if (!filePath) {
    return null;
  }
  const normalized = filePath.replace(/\\/g, "/");
  let idx = normalized.lastIndexOf("/backend/data/");
  if (idx !== -1) {
    const relative = normalized.slice(idx + "/backend/data".length);
    return `${SERVER_ROOT}/data${relative}`;
  }
  idx = normalized.lastIndexOf("/data/");
  if (idx !== -1) {
    const relative = normalized.slice(idx);
    return `${SERVER_ROOT}${relative}`;
  }
  if (normalized.includes("uploads") || normalized.includes("artifacts")) {
    const parts = normalized.split("/");
    const dataIdx = parts.findIndex((p) => p === "data");
    if (dataIdx !== -1 && dataIdx < parts.length - 1) {
      return `${SERVER_ROOT}/data/${parts.slice(dataIdx + 1).join("/")}`;
    }
    const uploadsIdx = parts.findIndex((p) => p === "uploads");
    const artifactsIdx = parts.findIndex((p) => p === "artifacts");
    const partIdx = uploadsIdx !== -1 ? uploadsIdx : artifactsIdx;
    if (partIdx !== -1 && partIdx < parts.length - 1) {
      return `${SERVER_ROOT}/data/${parts.slice(partIdx).join("/")}`;
    }
  }
  return null;
}

export async function fetchOverview(): Promise<DashboardOverview> {
  return parseJson(await fetchWithAuth(`${API_BASE}/dashboard/overview`));
}

export async function fetchHistory(): Promise<HistoryItem[]> {
  return parseJson(await fetchWithAuth(`${API_BASE}/dashboard/history`));
}

export async function fetchStudentProgress(): Promise<StudentProgress[]> {
  return parseJson(await fetchWithAuth(`${API_BASE}/dashboard/students/progress`));
}

export async function submitReview(
  runId: number,
  payload: { review_status: string; reviewed_text?: string }
): Promise<{ message: string }> {
  return parseJson(
    await fetchWithAuth(`${API_BASE}/ocr/${runId}/review`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload)
    })
  );
}

function buildOcrForm(payload: {
  file: File;
  studentId?: number;
  qualityMode: string;
  referenceText?: string;
}): FormData {
  const form = new FormData();
  form.append("file", payload.file);
  form.append("quality_mode", payload.qualityMode);
  if (payload.studentId) {
    form.append("student_id", String(payload.studentId));
  }
  if (payload.referenceText?.trim()) {
    form.append("reference_text", payload.referenceText.trim());
  }
  return form;
}

export async function processImage(payload: {
  file: File;
  studentId?: number;
  qualityMode: string;
  referenceText?: string;
}): Promise<OCRRun> {
  const primaryUrl = `${API_BASE}/ocr/process`;
  const fallbackUrl = `${EXERCISES_BASE}/api/ocr/process`;

  const tryFetch = async (url: string, useFallback: boolean): Promise<OCRRun> => {
    const form = buildOcrForm(payload);
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 10 * 60 * 1000); // 10 min (first run loads model)
    const headers = authHeaders();
    try {
      const res = await fetch(url, {
        method: "POST",
        body: form,
        signal: controller.signal,
        headers: Object.keys(headers).length ? headers : undefined
      });
      if (res.ok) {
        clearTimeout(timeoutId);
        return parseJson<OCRRun>(res);
      }
      if (res.status === 401 || res.status === 403) {
        handleUnauthorized();
      }
      if (res.status === 404 && useFallback && fallbackUrl !== primaryUrl) {
        clearTimeout(timeoutId);
        return tryFetch(fallbackUrl, false);
      }
      const text = await res.text();
      throw new Error(text || "Request failed");
    } finally {
      clearTimeout(timeoutId);
    }
  };

  return tryFetch(primaryUrl, true);
}

// ── Exercises API (dyslexia-backend) ────────────────────────────────────────

export async function fetchExerciseStudents(): Promise<ExerciseStudent[]> {
  return parseJson(await fetchWithAuth(`${EXERCISES_BASE}/students/`));
}

export async function createExerciseStudent(payload: { name: string; age?: number }): Promise<ExerciseStudent> {
  return parseJson(
    await fetchWithAuth(`${EXERCISES_BASE}/students/`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload)
    })
  );
}

export async function getNextExercise(
  studentId: string,
  type?: "word_typing" | "sentence_typing" | "handwriting" | "tracing"
): Promise<Exercise> {
  const url = new URL(`${EXERCISES_BASE}/exercises/next`);
  url.searchParams.set("student_id", studentId);
  if (type) url.searchParams.set("type", type);
  return parseJson(await fetchWithAuth(url.toString()));
}

export async function createSession(payload: {
  student_id: string;
  exercise_id: string;
  is_handwriting?: boolean;
}): Promise<{ session_id: string; expected: string }> {
  return parseJson(
    await fetchWithAuth(`${EXERCISES_BASE}/sessions/`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload)
    })
  );
}

export async function submitTyping(
  sessionId: string,
  payload: { student_response: string; duration_seconds?: number }
): Promise<{ session_id: string; score: number; feedback: string }> {
  return parseJson(
    await fetchWithAuth(`${EXERCISES_BASE}/sessions/${sessionId}/submit`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload)
    })
  );
}

export async function submitHandwriting(
  sessionId: string,
  file: File,
  durationSeconds?: number
): Promise<HandwritingSubmitResponse> {
  const form = new FormData();
  form.append("file", file);
  if (durationSeconds != null) {
    form.append("duration_seconds", String(durationSeconds));
  }
  return parseJson(
    await fetchWithAuth(`${EXERCISES_BASE}/sessions/${sessionId}/submit-handwriting`, {
      method: "POST",
      body: form
    })
  );
}

export async function submitTracing(
  sessionId: string,
  payload: {
    trace_score: number;
    duration_seconds?: number;
    stroke_errors?: Array<{ letter: string; accuracy: number }>;
  }
): Promise<{ score: number; feedback: string }> {
  return parseJson(
    await fetchWithAuth(`${EXERCISES_BASE}/sessions/${sessionId}/submit-tracing`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload)
    })
  );
}

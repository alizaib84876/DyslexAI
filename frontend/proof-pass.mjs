/**
 * Proof pass: verify routes, theme, and capture screenshots.
 * Run: node proof-pass.mjs
 * Requires: backend on :8000, frontend on :5173 (npm run dev)
 */
import { createWriteStream } from "fs";
import { mkdir } from "fs/promises";
import { pipeline } from "stream/promises";

const BASE = process.env.PROOF_BASE ?? "http://localhost:4173";
const PROOF_DIR = "proof-screenshots";

const ROUTES = [
  { path: "/", name: "Landing" },
  { path: "/signup", name: "Signup" },
  { path: "/login", name: "Login" },
  { path: "/dashboard", name: "Dashboard" },
  { path: "/workspace", name: "Workspace" },
  { path: "/exercises", name: "Exercises" },
  { path: "/game", name: "Game" },
  { path: "/library", name: "Library" },
  { path: "/students", name: "Students" },
  { path: "/history", name: "History" },
  { path: "/settings", name: "Settings" },
  { path: "/about", name: "About" },
  { path: "/help", name: "Help" },
  { path: "/privacy", name: "Privacy" },
  { path: "/terms", name: "Terms" },
];

async function fetchText(url) {
  const res = await fetch(url, { redirect: "follow" });
  return { status: res.status, text: await res.text() };
}

async function main() {
  console.log("=== Proof Pass ===\n");

  // 1. Verify frontend is up
  try {
    const { status } = await fetchText(BASE + "/");
    if (status !== 200) throw new Error(`Status ${status}`);
    console.log("[OK] Frontend: %s -> %d", BASE, status);
  } catch (e) {
    console.error("[FAIL] Frontend not reachable at %s:", BASE, e.message);
    process.exit(1);
  }

  // 2. Verify each route returns 200
  for (const { path, name } of ROUTES) {
    const url = BASE + path;
    try {
      const { status } = await fetchText(url);
      const ok = status === 200;
      console.log(ok ? "[OK]" : "[FAIL]", "%s %s -> %d", path, name, status);
    } catch (e) {
      console.log("[FAIL]", "%s %s:", path, name, e.message);
    }
  }

  // 3. Verify backend API
  const API = "http://localhost:8000";
  const endpoints = [
    ["GET", "/", "root"],
    ["GET", "/api/dashboard/overview", "dashboard/overview"],
    ["GET", "/api/dashboard/history", "dashboard/history"],
    ["GET", "/api/dashboard/students/progress", "dashboard/students/progress"],
    ["GET", "/students/", "students"],
  ];
  console.log("\n=== Backend API ===\n");
  for (const [method, path, label] of endpoints) {
    try {
      const res = await fetch(API + path, { method });
      const body = await res.text();
      const ok = res.ok;
      const preview = body.length > 80 ? body.slice(0, 80) + "..." : body;
      console.log(ok ? "[OK]" : "[FAIL]", "%s %s -> %d", method, path, res.status);
      if (ok && body) console.log("     ", preview.replace(/\n/g, " "));
    } catch (e) {
      console.log("[FAIL]", "%s %s:", method, path, e.message);
    }
  }

  // 4. Try Playwright for screenshots (optional)
  try {
    const pw = await import("playwright");
    await mkdir(PROOF_DIR, { recursive: true });
    const browser = await pw.chromium.launch({ headless: true });
    const page = await browser.newPage();
    await page.setViewportSize({ width: 1280, height: 720 });

    for (const { path, name } of ROUTES) {
      const url = BASE + path;
      await page.goto(url, { waitUntil: "networkidle", timeout: 10000 });
      const safe = name.replace(/\s+/g, "-").toLowerCase();
      const file = `${PROOF_DIR}/${safe}.png`;
      await page.screenshot({ path: file });
      console.log("[SCREENSHOT]", file);
    }

    // Prove theme: get computed CSS vars from :root
    await page.goto(BASE + "/dashboard", { waitUntil: "networkidle" });
    const vars = await page.evaluate(() => {
      const s = getComputedStyle(document.documentElement);
      return {
        "--color-primary": s.getPropertyValue("--color-primary").trim(),
        "--color-corrected": s.getPropertyValue("--color-corrected").trim(),
        "--spacing-md": s.getPropertyValue("--spacing-md").trim(),
        "--radius-md": s.getPropertyValue("--radius-md").trim(),
      };
    });
    console.log("\n=== Computed CSS Variables (from :root) ===\n", JSON.stringify(vars, null, 2));

    await browser.close();
  } catch (e) {
    console.log("\n[Playwright skipped]", e.message);
    console.log("To capture screenshots: npx playwright install && node proof-pass.mjs");
  }

  console.log("\n=== Proof pass complete ===");
}

main().catch(console.error);

import { NavLink, Navigate, Route, Routes } from "react-router-dom";

import { ProtectedRoute } from "./components/ProtectedRoute";
import { useAuth } from "./contexts/AuthContext";
import { AboutPage } from "./pages/AboutPage";
import { DashboardPage } from "./pages/DashboardPage";
import { ExercisesPage } from "./pages/ExercisesPage";
import { GamifiedExercisePage } from "./pages/GamifiedExercisePage";
import { HelpPage } from "./pages/HelpPage";
import { HistoryPage } from "./pages/HistoryPage";
import { LandingPage } from "./pages/LandingPage";
import { LibraryPage } from "./pages/LibraryPage";
import { LoginPage } from "./pages/LoginPage";
import { PrivacyPage } from "./pages/PrivacyPage";
import { SettingsPage } from "./pages/SettingsPage";
import { SignupPage } from "./pages/SignupPage";
import { StudentPage } from "./pages/StudentPage";
import { TermsPage } from "./pages/TermsPage";
import { WorkspacePage } from "./pages/WorkspacePage";

const navItems = [
  { to: "/dashboard", label: "Dashboard" },
  { to: "/exercises", label: "Exercises" },
  { to: "/game", label: "🎮 Game Mode" },
  { to: "/workspace", label: "Workspace" },
  { to: "/library", label: "Library" },
  { to: "/students", label: "Students" },
  { to: "/history", label: "History" },
  { to: "/settings", label: "Settings" },
];

function AppLayout() {
  const { user, logout } = useAuth();
  return (
    <ProtectedRoute>
      <div className="app-shell">
        <aside className="sidebar">
          <NavLink to="/dashboard" className="brand">
            <div className="brand-mark">D</div>
            <div>
              <strong>DyslexAI</strong>
              <p>Offline-first assistive OCR</p>
            </div>
          </NavLink>

          <nav className="nav-list">
          {navItems.map((item) => (
            <NavLink
              key={item.to}
              to={item.to}
              className={({ isActive }) => `nav-link ${isActive ? "nav-link-active" : ""}`}
            >
              {item.label}
            </NavLink>
          ))}
        </nav>
        <div className="sidebar-footer">
          <span className="sidebar-user">{user?.email}</span>
          <button type="button" className="nav-link logout-btn" onClick={() => logout()}>
            Log out
          </button>
        </div>
      </aside>

      <main className="main-content">
        <Routes>
          <Route path="/dashboard" element={<DashboardPage />} />
          <Route path="/exercises" element={<ExercisesPage />} />
          <Route path="/game" element={<GamifiedExercisePage />} />
          <Route path="/workspace" element={<WorkspacePage />} />
          <Route path="/library" element={<LibraryPage />} />
          <Route path="/students" element={<StudentPage />} />
          <Route path="/history" element={<HistoryPage />} />
          <Route path="/settings" element={<SettingsPage />} />
          <Route path="/about" element={<AboutPage />} />
          <Route path="/help" element={<HelpPage />} />
          <Route path="/privacy" element={<PrivacyPage />} />
          <Route path="/terms" element={<TermsPage />} />
          <Route path="*" element={<Navigate to="/dashboard" replace />} />
        </Routes>
      </main>
      </div>
    </ProtectedRoute>
  );
}

export default function App() {
  return (
    <Routes>
      <Route path="/" element={<LandingPage />} />
      <Route path="/signup" element={<SignupPage />} />
      <Route path="/login" element={<LoginPage />} />
      <Route path="/*" element={<AppLayout />} />
    </Routes>
  );
}

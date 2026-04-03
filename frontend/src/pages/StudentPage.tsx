import { useEffect, useState } from "react";

import { StudentStatsCard } from "../components/StudentStatsCard";
import { KidIcon } from "../components/KidIcon";
import {
  fetchExerciseStudents,
  fetchExerciseStats,
} from "../lib/api";
import type { ExerciseStudent } from "../types";
import type { ExerciseStats } from "../lib/api";

export function StudentPage() {
  const [students, setStudents] = useState<ExerciseStudent[]>([]);
  const [error, setError] = useState<string | null>(null);

  // Selected student stats
  const [selectedStudent, setSelectedStudent] = useState<ExerciseStudent | null>(null);
  const [stats, setStats] = useState<ExerciseStats | null>(null);
  const [statsLoading, setStatsLoading] = useState(false);
  const [statsError, setStatsError] = useState<string | null>(null);

  async function refresh() {
    setError(null);
    try {
      const studentResponse = await fetchExerciseStudents().catch(() => []);
      setStudents(studentResponse);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Failed to load students");
    }
  }

  useEffect(() => { void refresh(); }, []);

  async function handleSelectStudent(student: ExerciseStudent) {
    setSelectedStudent(student);
    setStats(null);
    setStatsError(null);
    setStatsLoading(true);
    try {
      const data = await fetchExerciseStats(String(student.id));
      setStats(data);
    } catch (e) {
      setStatsError(e instanceof Error ? e.message : "Failed to load stats");
    } finally {
      setStatsLoading(false);
    }
  }

  return (
    <div className="page-stack">
      <section className="hero">
        <div>
          <span className="hero-badge">Student Management</span>
          <h1>Students Dashboard</h1>
          <p>View all students and their exercise progress.</p>
        </div>
      </section>

      {error && <div className="error-banner">{error}</div>}

      <div className="students-layout">
        {/* Left: student list */}
        <div className="students-sidebar">
          <div className="card">
            <div className="card-header">
              <h3>All Students ({students.length})</h3>
              <p>Click a student to view their full progress.</p>
            </div>
            <div className="line-list">
              {students.length === 0 && (
                <p style={{ color: "var(--color-text-muted)", padding: "8px 0" }}>No students yet.</p>
              )}
              {students.map((student) => (
                <button
                  key={student.id}
                  className={`student-list-btn ${selectedStudent?.id === student.id ? "student-list-btn-active" : ""}`}
                  onClick={() => handleSelectStudent(student)}
                >
                  <strong>{student.name}</strong>
                  <span>
                    Level {student.difficulty_level} · {student.total_sessions} sessions <KidIcon name="flame" />{" "}
                    {student.streak_days}
                  </span>
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* Right: selected student stats */}
        <div className="students-detail">
          {!selectedStudent && (
            <div className="card" style={{ textAlign: "center", color: "var(--color-text-muted)" }}>
              <p style={{ fontSize: "2rem" }}>
                <KidIcon name="arrowLeft" />
              </p>
              <p>Select a student from the list to see their exercise progress.</p>
            </div>
          )}
          {selectedStudent && (
            <>
              <div className="card">
                <h3>{selectedStudent.name}</h3>
                <p style={{ color: "var(--color-text-secondary)", marginTop: 4 }}>
                  {selectedStudent.age ? `Age ${selectedStudent.age} · ` : ""}
                  Level {selectedStudent.difficulty_level} · {selectedStudent.total_sessions} total sessions ·{" "}
                  <KidIcon name="flame" /> {selectedStudent.streak_days} day streak
                </p>
              </div>
              {statsLoading && <div className="card" style={{ textAlign: "center" }}>Loading stats…</div>}
              {statsError && <div className="error-banner">{statsError}</div>}
              {stats && <StudentStatsCard stats={stats} />}
            </>
          )}
        </div>
      </div>
    </div>
  );
}


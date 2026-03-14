import { useEffect, useState } from "react";
import type { FormEvent } from "react";

import {
  createExerciseStudent,
  fetchExerciseStudents,
  fetchStudentProgress
} from "../lib/api";
import type { ExerciseStudent, StudentProgress } from "../types";

export function StudentPage() {
  const [students, setStudents] = useState<ExerciseStudent[]>([]);
  const [progress, setProgress] = useState<StudentProgress[]>([]);
  const [name, setName] = useState("");
  const [age, setAge] = useState("");
  const [error, setError] = useState<string | null>(null);

  async function refresh() {
    setError(null);
    try {
      const [studentResponse, progressResponse] = await Promise.all([
        fetchExerciseStudents().catch(() => []),
        fetchStudentProgress().catch(() => [])
      ]);
      setStudents(studentResponse);
      setProgress(progressResponse);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Failed to load students");
    }
  }

  useEffect(() => {
    void refresh();
  }, []);

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!name.trim()) return;
    setError(null);
    try {
      const ageNum = age ? parseInt(age, 10) : undefined;
      await createExerciseStudent({
        name: name.trim(),
        age: ageNum != null && !isNaN(ageNum) ? ageNum : undefined
      });
      setName("");
      setAge("");
      await refresh();
    } catch (e) {
      setError(e instanceof Error ? e.message : "Failed to create student");
    }
  }

  return (
    <div className="page-stack">
      <section className="hero">
        <div>
          <span className="hero-badge">Student Management</span>
          <h1>Students and Tracking Profiles</h1>
          <p>Create local student profiles so progress and correction history remain organized.</p>
        </div>
      </section>

      {error && <div className="error-banner">{error}</div>}

      <section className="dashboard-grid">
        <article className="card">
          <div className="card-header">
            <h3>Add Student</h3>
            <p>Create a local profile for exercises and game mode.</p>
          </div>
          <form className="upload-form" onSubmit={handleSubmit}>
            <label className="field">
              <span>Name</span>
              <input value={name} onChange={(event) => setName(event.target.value)} required />
            </label>
            <label className="field">
              <span>Age (optional)</span>
              <input
                type="number"
                min="5"
                max="18"
                placeholder="e.g. 8"
                value={age}
                onChange={(e) => setAge(e.target.value)}
              />
            </label>
            <button className="primary-button" type="submit">
              Create Student
            </button>
          </form>
        </article>

        <article className="card">
          <div className="card-header">
            <h3>Local Profiles</h3>
            <p>Saved students and their current progress metrics.</p>
          </div>
          <div className="line-list">
            {students.map((student) => {
              const progressItem = progress.find(
                (item) => String(item.student_id) === String(student.id)
              );
              return (
                <article className="line-card" key={student.id}>
                  <strong>{student.name}</strong>
                  <p>{student.age != null ? `Age ${student.age}` : "Age not set"}</p>
                  <p>Level {student.difficulty_level} • {student.total_sessions} sessions</p>
                  <div className="badge-row">
                    <span className="badge">
                      {progressItem?.total_runs ?? student.total_sessions} runs
                    </span>
                    <span className="badge">
                      {progressItem
                        ? `${(100 * (progressItem.avg_confidence ?? 0)).toFixed(1)}% confidence`
                        : `🔥 ${student.streak_days} day streak`}
                    </span>
                  </div>
                </article>
              );
            })}
          </div>
        </article>
      </section>
    </div>
  );
}

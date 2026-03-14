import { useMemo, useState } from "react";
import type { FormEvent } from "react";

type StudentOption = { id: string; name: string };

type Props = {
  students: StudentOption[];
  onSubmit: (payload: {
    file: File;
    studentId?: number | string;
    qualityMode: string;
    referenceText?: string;
  }) => Promise<void>;
  busy: boolean;
};

export function UploadPanel({ students, onSubmit, busy }: Props) {
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [studentId, setStudentId] = useState<string>("");
  const [qualityMode, setQualityMode] = useState("quality_local");
  const [referenceText, setReferenceText] = useState("");

  const acceptedTypes = useMemo(
    () => ".png,.jpg,.jpeg,.webp,.bmp,.tif,.tiff,.pdf",
    []
  );

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!selectedFile) {
      return;
    }

    await onSubmit({
      file: selectedFile,
      studentId: studentId || undefined,
      qualityMode,
      referenceText
    });
  }

  return (
    <section className="card">
      <div className="card-header">
        <h3>Upload Handwriting Sample</h3>
        <p>Designed for noisy, skewed, low-quality, and difficult dyslexic handwriting inputs.</p>
      </div>

      <form className="upload-form" onSubmit={handleSubmit}>
        <label className="field">
          <span>Student</span>
          <select value={studentId} onChange={(event) => setStudentId(event.target.value)}>
            <option value="">Unassigned</option>
            {students.map((student) => (
              <option key={student.id} value={String(student.id)}>
                {student.name}
              </option>
            ))}
          </select>
        </label>

        <label className="field">
          <span>Processing Mode</span>
          <select value={qualityMode} onChange={(event) => setQualityMode(event.target.value)}>
            <option value="quality_local">Quality (local) — best for handwriting (TrOCR)</option>
            <option value="fast_local">Fast — quickest, PaddleOCR only</option>
            <option value="cloud_refine">Cloud refine — quality + optional cloud (future)</option>
          </select>
          <p className="field-hint" style={{ fontSize: '12px', color: '#64748b', marginTop: '4px' }}>
            {qualityMode === 'quality_local' && "Best for handwriting. Uses DocTR + TrOCR (30–90 sec)."}
            {qualityMode === 'fast_local' && "Fastest. DocTR + TrOCR-base. Good for typed text."}
            {qualityMode === 'cloud_refine' && "Same as Quality. Cloud refinement planned."}
          </p>
        </label>

        <label className="field">
          <span>Image or PDF</span>
          <input
            type="file"
            accept={acceptedTypes}
            onChange={(event) => setSelectedFile(event.target.files?.[0] ?? null)}
          />
        </label>

        <label className="field">
          <span>Reference Transcript for CER/WER Evaluation (optional)</span>
          <textarea
            rows={5}
            value={referenceText}
            onChange={(event) => setReferenceText(event.target.value)}
            placeholder="Paste the correct paragraph here if you want this run scored against a transcript."
          />
        </label>

        <button className="primary-button" type="submit" disabled={!selectedFile || busy}>
          {busy ? "Processing… please wait" : "Process Document"}
        </button>
      </form>
    </section>
  );
}

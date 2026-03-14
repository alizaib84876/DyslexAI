export function PrivacyPage() {
  return (
    <div className="legal-page">
      <h1>Privacy Policy</h1>
      <section>
        <h2>Data We Collect</h2>
        <p>
          DyslexAI processes documents you upload for OCR and correction. Image files
          and extracted text are stored locally on the server for review and history.
          Student profiles and exercise results are stored in the local database.
        </p>
      </section>
      <section>
        <h2>How We Use Data</h2>
        <p>
          Your data is used solely to provide OCR, correction, and learning exercise
          functionality. We do not share your data with third parties. When using
          optional cloud refinement (e.g., Groq), text may be sent to the configured
          API for processing.
        </p>
      </section>
      <section>
        <h2>Data Retention</h2>
        <p>
          OCR runs and student progress are retained in the local database. You can
          request deletion of your data by contacting your administrator.
        </p>
      </section>
      <section>
        <h2>Security</h2>
        <p>
          Data is stored on the server where you run DyslexAI. Ensure your deployment
          uses HTTPS and appropriate access controls.
        </p>
      </section>
      <p className="legal-muted">Last updated: 2025</p>
    </div>
  );
}

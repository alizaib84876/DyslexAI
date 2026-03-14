import { Link } from "react-router-dom";

export function LandingPage() {
  return (
    <div className="landing-page">
      <div className="landing-hero">
        <div className="landing-logo">📖</div>
        <h1>DyslexAI</h1>
        <p className="landing-tagline">
          Assistive OCR and learning exercises for dyslexia-friendly reading and writing.
        </p>
        <div className="landing-actions">
          <Link to="/signup" className="primary-button landing-cta">
            Get Started
          </Link>
          <Link to="/login" className="secondary-button">
            I already have an account
          </Link>
        </div>
      </div>
    </div>
  );
}

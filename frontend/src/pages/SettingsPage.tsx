import { Link } from "react-router-dom";

export function SettingsPage() {
  return (
    <div className="page-stack">
      <section className="hero">
        <div>
          <span className="hero-badge">Settings</span>
          <h1>Settings</h1>
          <p>Manage your preferences and access app information.</p>
        </div>
      </section>

      <section className="card">
        <div className="card-header">
          <h3>Menu</h3>
          <p>Same typography and spacing as the mobile app.</p>
        </div>
        <nav className="settings-menu">
          <Link to="/about" className="settings-item">About</Link>
          <Link to="/help" className="settings-item">Help</Link>
          <Link to="/privacy" className="settings-item">Privacy</Link>
          <Link to="/terms" className="settings-item">Terms</Link>
          <Link to="/" className="settings-item settings-logout">Logout</Link>
        </nav>
      </section>
    </div>
  );
}

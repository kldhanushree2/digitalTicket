import { Link } from "react-router-dom";
import { useAuth } from "../context/AuthContext";

const FEATURES = [
  {
    icon: "🎟️",
    title: "One place for every ticket",
    desc: "Movie, flight, train, bus, concert, or conference — upload it once and find it instantly.",
  },
  {
    icon: "🔎",
    title: "Auto-fill with OCR & QR scan",
    desc: "Snap or upload a ticket and DigitalTicket reads the event name, date, time, and venue for you.",
  },
  {
    icon: "⏰",
    title: "Reminders & calendar sync",
    desc: "Live countdowns, in-app reminders, and one-tap export to Google Calendar so you never miss an event.",
  },
];

const Home = () => {
  const { user } = useAuth();

  return (
    <div>
      <div className="hero-section">
        <img src="/logo.png" alt="DigitalTicket logo" className="hero-logo" />
        <div className="hero-badge">🎫 Your tickets, organized</div>

        <div className="home-page">
          <h1>All your tickets, in one place.</h1>
          <p>
            Stop digging through screenshots, downloads, and WhatsApp chats. Upload your movie,
            flight, train, bus, concert, and event tickets to DigitalTicket and find them
            instantly.
          </p>
          {user ? (
            <Link to="/dashboard" className="btn btn-primary">
              Go to Dashboard
            </Link>
          ) : (
            <div className="button-row">
              <Link to="/register" className="btn btn-primary">
                Get Started
              </Link>
              <Link to="/login" className="btn btn-secondary">
                Login
              </Link>
            </div>
          )}
        </div>
      </div>

      <div className="features-grid">
        {FEATURES.map((f) => (
          <div className="feature-card" key={f.title}>
            <div className="feature-icon">{f.icon}</div>
            <h3>{f.title}</h3>
            <p>{f.desc}</p>
          </div>
        ))}
      </div>
    </div>
  );
};

export default Home;

import { Link } from "react-router-dom";
import { useAuth } from "../context/AuthContext";

const Home = () => {
  const { user } = useAuth();

  return (
    <div className="home-page">
      <h1>All your tickets, in one place.</h1>
      <p>
        Stop digging through screenshots, downloads, and WhatsApp chats. Upload your movie,
        flight, train, bus, concert, and event tickets to DigitalTicket and find them instantly.
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
  );
};

export default Home;

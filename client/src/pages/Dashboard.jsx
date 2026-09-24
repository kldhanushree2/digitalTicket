import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import ticketService from "../services/ticketService";
import TicketCard from "../components/TicketCard";
import EmptyState from "../components/EmptyState";
import { SkeletonGrid } from "../components/SkeletonCard";
import { useAuth } from "../context/AuthContext";
import { ReminderSettings } from "../components/ReminderManager";

// Splits the flat ticket list into buckets based on date, so the
// dashboard can show meaningful counts without a separate API call.
const categorizeTickets = (tickets) => {
  const now = new Date();
  const todayStr = now.toDateString();

  const upcoming = [];
  const today = [];
  const completed = [];

  tickets.forEach((t) => {
    const eventDate = new Date(t.date);
    if (eventDate.toDateString() === todayStr) {
      today.push(t);
    } else if (eventDate.getTime() > now.getTime()) {
      upcoming.push(t);
    } else {
      completed.push(t);
    }
  });

  return { upcoming, today, completed };
};

const Dashboard = () => {
  const { user } = useAuth();
  const [tickets, setTickets] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    const fetchTickets = async () => {
      try {
        const data = await ticketService.getTickets();
        setTickets(data);
      } catch (err) {
        setError(err.response?.data?.message || "Could not load tickets");
      } finally {
        setLoading(false);
      }
    };
    fetchTickets();
  }, []);

  if (error) return <p className="page-status form-error">{error}</p>;

  const { upcoming, today, completed } = categorizeTickets(tickets);
  const recent = [...tickets]
    .sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt))
    .slice(0, 3);

  return (
    <div className="page">
      <h1>Welcome back, {user?.name} 👋</h1>

      <ReminderSettings />

      <div className="stats-grid">
        <div className="stat-card">
          <span className="stat-icon">🎟️</span>
          <span className="stat-number">{loading ? "—" : tickets.length}</span>
          <span className="stat-label">Total Tickets</span>
        </div>
        <div className="stat-card">
          <span className="stat-icon">⏳</span>
          <span className="stat-number">{loading ? "—" : upcoming.length}</span>
          <span className="stat-label">Upcoming</span>
        </div>
        <div className="stat-card">
          <span className="stat-icon">📅</span>
          <span className="stat-number">{loading ? "—" : today.length}</span>
          <span className="stat-label">Today</span>
        </div>
        <div className="stat-card">
          <span className="stat-icon">✅</span>
          <span className="stat-number">{loading ? "—" : completed.length}</span>
          <span className="stat-label">Completed</span>
        </div>
      </div>

      <div className="section-header">
        <h2>Recently Added</h2>
        <Link to="/upload" className="btn btn-primary">
          + Upload Ticket
        </Link>
      </div>

      {loading ? (
        <SkeletonGrid count={3} />
      ) : recent.length === 0 ? (
        <EmptyState
          icon="🎫"
          title="No tickets yet"
          message="Upload your first movie, flight, train, bus, or event ticket to see it here."
          actionTo="/upload"
          actionLabel="Upload a Ticket"
        />
      ) : (
        <div className="ticket-grid">
          {recent.map((ticket) => (
            <TicketCard key={ticket._id} ticket={ticket} />
          ))}
        </div>
      )}
    </div>
  );
};

export default Dashboard;

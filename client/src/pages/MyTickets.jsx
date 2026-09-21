import { useEffect, useState } from "react";
import ticketService from "../services/ticketService";
import TicketCard from "../components/TicketCard";

const CATEGORIES = ["All", "Movie", "Flight", "Train", "Bus", "Concert", "Sports", "Conference", "Other"];
const STATUSES = ["All", "Upcoming", "Today", "Completed"];
const SORT_OPTIONS = [
  { value: "newest", label: "Newest" },
  { value: "oldest", label: "Oldest" },
  { value: "eventDate", label: "Event Date" },
];

// Same date-bucketing logic as Dashboard.jsx - a ticket is "Today" if its
// event date matches today's calendar date, "Upcoming" if it's in the
// future, and "Completed" otherwise.
const getTicketStatus = (ticket) => {
  const now = new Date();
  const eventDate = new Date(ticket.date);

  if (eventDate.toDateString() === now.toDateString()) return "Today";
  if (eventDate.getTime() > now.getTime()) return "Upcoming";
  return "Completed";
};

const MyTickets = () => {
  const [tickets, setTickets] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [search, setSearch] = useState("");
  const [category, setCategory] = useState("All");
  const [status, setStatus] = useState("All");
  const [sortBy, setSortBy] = useState("newest");

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

  // Filtering happens client-side since the list is already loaded -
  // fine for a personal ticket collection of this scale.
  const filtered = tickets
    .filter((t) => {
      const matchesCategory = category === "All" || t.category === category;
      const matchesStatus = status === "All" || getTicketStatus(t) === status;
      const q = search.toLowerCase();
      const matchesSearch =
        !q ||
        t.eventName.toLowerCase().includes(q) ||
        (t.venue || "").toLowerCase().includes(q) ||
        (t.ticketNumber || "").toLowerCase().includes(q);
      return matchesCategory && matchesStatus && matchesSearch;
    })
    .sort((a, b) => {
      if (sortBy === "newest") return new Date(b.createdAt) - new Date(a.createdAt);
      if (sortBy === "oldest") return new Date(a.createdAt) - new Date(b.createdAt);
      // "eventDate": soonest event first
      return new Date(a.date) - new Date(b.date);
    });

  if (loading) return <p className="page-status">Loading tickets...</p>;
  if (error) return <p className="page-status form-error">{error}</p>;

  return (
    <div className="page">
      <h1>My Tickets</h1>

      <div className="filter-bar">
        <input
          type="text"
          placeholder="Search by event, venue, or ticket number..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
        />
        <select value={category} onChange={(e) => setCategory(e.target.value)}>
          {CATEGORIES.map((c) => (
            <option key={c} value={c}>
              {c}
            </option>
          ))}
        </select>
        <select value={status} onChange={(e) => setStatus(e.target.value)}>
          {STATUSES.map((s) => (
            <option key={s} value={s}>
              {s === "All" ? "All Statuses" : s}
            </option>
          ))}
        </select>
        <select value={sortBy} onChange={(e) => setSortBy(e.target.value)}>
          {SORT_OPTIONS.map((opt) => (
            <option key={opt.value} value={opt.value}>
              Sort: {opt.label}
            </option>
          ))}
        </select>
      </div>

      {filtered.length === 0 ? (
        <p className="page-status">No tickets match your search.</p>
      ) : (
        <div className="ticket-grid">
          {filtered.map((ticket) => (
            <TicketCard key={ticket._id} ticket={ticket} />
          ))}
        </div>
      )}
    </div>
  );
};

export default MyTickets;

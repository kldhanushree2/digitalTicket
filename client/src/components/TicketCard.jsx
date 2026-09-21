import { useState, useEffect } from "react";
import { Link } from "react-router-dom";

// Maps ticket category to an emoji, matching the mockup in the project spec
const CATEGORY_ICONS = {
  Movie: "🎬",
  Flight: "✈️",
  Train: "🚆",
  Bus: "🚌",
  Concert: "🎤",
  Sports: "🏟️",
  Conference: "🎓",
  Other: "🎫",
};

// Given an event date + time, returns a human-readable countdown string,
// or "Event completed" if it's in the past.
const getCountdown = (dateStr, timeStr) => {
  const eventDate = new Date(dateStr);
  if (timeStr) {
    const [hours, minutes] = timeStr.split(":").map(Number);
    eventDate.setHours(hours || 0, minutes || 0, 0, 0);
  }

  const diffMs = eventDate.getTime() - Date.now();

  if (diffMs <= 0) {
    return "Event completed";
  }

  const days = Math.floor(diffMs / (1000 * 60 * 60 * 24));
  const hoursLeft = Math.floor((diffMs / (1000 * 60 * 60)) % 24);
  const minutesLeft = Math.floor((diffMs / (1000 * 60)) % 60);
  const secondsLeft = Math.floor((diffMs / 1000) % 60);

  if (days > 0) return `${days}d ${hoursLeft}h ${minutesLeft}m`;
  if (hoursLeft > 0) return `${hoursLeft}h ${minutesLeft}m ${secondsLeft}s`;
  return `${minutesLeft}m ${secondsLeft}s`;
};

const TicketCard = ({ ticket }) => {
  const [countdown, setCountdown] = useState(() => getCountdown(ticket.date, ticket.time));

  // Ticks every second so the countdown updates live without a page refresh,
  // matching the spec's "countdown should update automatically" requirement.
  useEffect(() => {
    const interval = setInterval(() => {
      setCountdown(getCountdown(ticket.date, ticket.time));
    }, 1000);
    return () => clearInterval(interval); // cleanup when component unmounts
  }, [ticket.date, ticket.time]);

  const formattedDate = new Date(ticket.date).toLocaleDateString("en-IN", {
    day: "numeric",
    month: "long",
    year: "numeric",
  });

  return (
    <div className="ticket-card">
      <div className="ticket-card-header">
        <span className="ticket-icon">{CATEGORY_ICONS[ticket.category] || "🎫"}</span>
        <h3>{ticket.eventName}</h3>
      </div>

      <p className="ticket-date">
        {formattedDate} {ticket.time && `· ${ticket.time}`}
      </p>

      {ticket.venue && <p className="ticket-venue">{ticket.venue}</p>}
      {ticket.seatNumber && <p className="ticket-seat">Seat: {ticket.seatNumber}</p>}

      <p className={`ticket-countdown ${countdown === "Event completed" ? "completed" : ""}`}>
        {countdown === "Event completed" ? countdown : `Starts in: ${countdown}`}
      </p>

      <Link to={`/tickets/${ticket._id}`} className="btn-view">
        View Ticket
      </Link>
    </div>
  );
};

export default TicketCard;

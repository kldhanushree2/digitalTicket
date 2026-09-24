import { Link } from "react-router-dom";

// Reusable "nothing here yet" panel — used wherever a list can be empty
// (Dashboard, My Tickets, Calendar day view, etc.)
const EmptyState = ({ icon = "🎫", title, message, actionTo, actionLabel }) => (
  <div className="empty-state">
    <div className="empty-state-icon">{icon}</div>
    <h3>{title}</h3>
    {message && <p>{message}</p>}
    {actionTo && actionLabel && (
      <Link to={actionTo} className="btn btn-primary">
        {actionLabel}
      </Link>
    )}
  </div>
);

export default EmptyState;

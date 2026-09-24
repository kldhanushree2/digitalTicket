// Shimmering placeholder shown in place of a TicketCard while data loads,
// so the layout doesn't jump once real cards arrive.
const SkeletonCard = () => (
  <div className="ticket-card skeleton-card">
    <div className="skeleton-line skeleton-title" />
    <div className="skeleton-line skeleton-sm" />
    <div className="skeleton-line skeleton-sm" style={{ width: "60%" }} />
    <div className="skeleton-line skeleton-pill" />
  </div>
);

export const SkeletonGrid = ({ count = 3 }) => (
  <div className="ticket-grid">
    {Array.from({ length: count }).map((_, i) => (
      <SkeletonCard key={i} />
    ))}
  </div>
);

export default SkeletonCard;

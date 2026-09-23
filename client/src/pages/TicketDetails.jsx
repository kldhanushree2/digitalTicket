import { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import ticketService from "../services/ticketService";
import { buildGoogleCalendarUrl, downloadIcsFile } from "../utils/calendarExport";

const API_ORIGIN = (import.meta.env.VITE_API_URL || "http://localhost:5000/api").replace(
  "/api",
  ""
);

// A ticket's fileUrl is relative ("/uploads/xxx.jpg") when the backend is
// using local disk storage, but a full absolute URL
// ("https://res.cloudinary.com/...") when using Cloudinary - see Module 8's
// storageProvider flag. Blindly prepending API_ORIGIN to an already-absolute
// URL produces a broken concatenated string, so we only prepend it when the
// URL doesn't already start with http:// or https://.
const resolveFileUrl = (rawFileUrl) => {
  if (!rawFileUrl) return "";
  return /^https?:\/\//i.test(rawFileUrl) ? rawFileUrl : `${API_ORIGIN}${rawFileUrl}`;
};

const TicketDetails = () => {
  const { id } = useParams();
  const navigate = useNavigate();

  const [ticket, setTicket] = useState(null);
  const [editing, setEditing] = useState(false);
  const [form, setForm] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    const fetchTicket = async () => {
      try {
        const data = await ticketService.getTicketById(id);
        setTicket(data);
        setForm(data);
      } catch (err) {
        setError(err.response?.data?.message || "Could not load ticket");
      } finally {
        setLoading(false);
      }
    };
    fetchTicket();
  }, [id]);

  const handleChange = (e) => {
    setForm({ ...form, [e.target.name]: e.target.value });
  };

  const handleSave = async () => {
    try {
      const updated = await ticketService.updateTicket(id, {
        eventName: form.eventName,
        category: form.category,
        date: form.date?.slice(0, 10),
        time: form.time,
        venue: form.venue,
        seatNumber: form.seatNumber,
        ticketNumber: form.ticketNumber,
        gateNumber: form.gateNumber,
        notes: form.notes,
      });
      setTicket(updated);
      setForm(updated);
      setEditing(false);
    } catch (err) {
      setError(err.response?.data?.message || "Update failed");
    }
  };

  const handleDelete = async () => {
    if (!window.confirm("Delete this ticket? This cannot be undone.")) return;
    try {
      await ticketService.deleteTicket(id);
      navigate("/tickets");
    } catch (err) {
      setError(err.response?.data?.message || "Delete failed");
    }
  };

  if (loading) return <p className="page-status">Loading ticket...</p>;
  if (error && !ticket) return <p className="page-status form-error">{error}</p>;
  if (!ticket) return null;

  const fileUrl = resolveFileUrl(ticket.fileUrl);
  const isPdf = ticket.fileType === "application/pdf";

  return (
    <div className="page">
      <h1>{ticket.eventName}</h1>
      {error && <p className="form-error">{error}</p>}

      <div className="ticket-details-layout">
        <div className="ticket-file-preview">
          {isPdf ? (
            <>
              {/* Browsers with a built-in PDF viewer (Chrome, Edge, Firefox,
                  Safari) render this inline automatically - no extra
                  library needed. Some mobile browsers don't support
                  embedded PDFs well, so we keep an "open in new tab" link
                  underneath as a fallback for those cases. */}
              <iframe src={fileUrl} title={ticket.eventName} className="ticket-pdf-embed" />
              <a href={fileUrl} target="_blank" rel="noreferrer" className="pdf-fallback-link">
                Open in new tab
              </a>
            </>
          ) : (
            <img src={fileUrl} alt={ticket.eventName} />
          )}
        </div>

        <div className="ticket-info">
          {editing ? (
            <>
              <label>Event Name</label>
              <input name="eventName" value={form.eventName} onChange={handleChange} />

              <label>Date</label>
              <input
                type="date"
                name="date"
                value={form.date?.slice(0, 10)}
                onChange={handleChange}
              />

              <label>Time</label>
              <input type="time" name="time" value={form.time || ""} onChange={handleChange} />

              <label>Venue</label>
              <input name="venue" value={form.venue || ""} onChange={handleChange} />

              <label>Seat Number</label>
              <input name="seatNumber" value={form.seatNumber || ""} onChange={handleChange} />

              <label>Ticket Number</label>
              <input
                name="ticketNumber"
                value={form.ticketNumber || ""}
                onChange={handleChange}
              />

              <label>Notes</label>
              <textarea name="notes" value={form.notes || ""} onChange={handleChange} rows={3} />

              <div className="button-row">
                <button className="btn btn-primary" onClick={handleSave}>
                  Save Changes
                </button>
                <button className="btn btn-secondary" onClick={() => setEditing(false)}>
                  Cancel
                </button>
              </div>
            </>
          ) : (
            <>
              <p>
                <strong>Category:</strong> {ticket.category}
              </p>
              <p>
                <strong>Date:</strong>{" "}
                {new Date(ticket.date).toLocaleDateString("en-IN", {
                  day: "numeric",
                  month: "long",
                  year: "numeric",
                })}
              </p>
              {ticket.time && (
                <p>
                  <strong>Time:</strong> {ticket.time}
                </p>
              )}
              {ticket.venue && (
                <p>
                  <strong>Venue:</strong> {ticket.venue}
                </p>
              )}
              {ticket.seatNumber && (
                <p>
                  <strong>Seat:</strong> {ticket.seatNumber}
                </p>
              )}
              {ticket.ticketNumber && (
                <p>
                  <strong>Ticket #:</strong> {ticket.ticketNumber}
                </p>
              )}
              {ticket.gateNumber && (
                <p>
                  <strong>Gate:</strong> {ticket.gateNumber}
                </p>
              )}
              {ticket.notes && (
                <p>
                  <strong>Notes:</strong> {ticket.notes}
                </p>
              )}

              <div className="button-row">
                <button className="btn btn-primary" onClick={() => setEditing(true)}>
                  Edit
                </button>
                <button className="btn btn-danger" onClick={handleDelete}>
                  Delete
                </button>
              </div>

              <div className="button-row">
                <a
                  href={buildGoogleCalendarUrl(ticket)}
                  target="_blank"
                  rel="noreferrer"
                  className="btn btn-secondary"
                >
                  Add to Google Calendar
                </a>
                <button className="btn btn-secondary" onClick={() => downloadIcsFile(ticket)}>
                  Download .ics
                </button>
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
};

export default TicketDetails;

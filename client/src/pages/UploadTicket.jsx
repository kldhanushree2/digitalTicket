import { useState } from "react";
import { useNavigate } from "react-router-dom";
import ticketService from "../services/ticketService";

const CATEGORIES = ["Movie", "Flight", "Train", "Bus", "Concert", "Sports", "Conference", "Other"];

const initialFormState = {
  eventName: "",
  category: "Movie",
  date: "",
  time: "",
  venue: "",
  seatNumber: "",
  ticketNumber: "",
  gateNumber: "",
  notes: "",
};

const UploadTicket = () => {
  const [form, setForm] = useState(initialFormState);
  const [file, setFile] = useState(null);
  const [preview, setPreview] = useState(null);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const navigate = useNavigate();

  const handleChange = (e) => {
    setForm({ ...form, [e.target.name]: e.target.value });
  };

  const handleFileChange = (e) => {
    const selected = e.target.files[0];
    setFile(selected);

    // Show an image preview when possible; PDFs just show the filename.
    if (selected && selected.type.startsWith("image/")) {
      setPreview(URL.createObjectURL(selected));
    } else {
      setPreview(null);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");

    if (!file) {
      setError("Please select a ticket file (JPG, PNG, or PDF).");
      return;
    }

    setLoading(true);
    try {
      const ticket = await ticketService.createTicket(form, file);
      navigate(`/tickets/${ticket._id}`);
    } catch (err) {
      setError(err.response?.data?.message || "Upload failed. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="page">
      <h1>Upload Ticket</h1>

      <form className="ticket-form" onSubmit={handleSubmit}>
        {error && <p className="form-error">{error}</p>}

        <label>Ticket File (JPG, PNG, or PDF - max 10MB)</label>
        <input type="file" accept=".jpg,.jpeg,.png,.pdf" onChange={handleFileChange} required />
        {preview && <img src={preview} alt="Preview" className="file-preview" />}
        {file && !preview && <p className="file-name">{file.name}</p>}

        <div className="form-row">
          <div>
            <label>Event Name</label>
            <input
              type="text"
              name="eventName"
              value={form.eventName}
              onChange={handleChange}
              required
            />
          </div>
          <div>
            <label>Category</label>
            <select name="category" value={form.category} onChange={handleChange}>
              {CATEGORIES.map((c) => (
                <option key={c} value={c}>
                  {c}
                </option>
              ))}
            </select>
          </div>
        </div>

        <div className="form-row">
          <div>
            <label>Date</label>
            <input type="date" name="date" value={form.date} onChange={handleChange} required />
          </div>
          <div>
            <label>Time</label>
            <input type="time" name="time" value={form.time} onChange={handleChange} />
          </div>
        </div>

        <label>Venue</label>
        <input type="text" name="venue" value={form.venue} onChange={handleChange} />

        <div className="form-row">
          <div>
            <label>Seat Number</label>
            <input
              type="text"
              name="seatNumber"
              value={form.seatNumber}
              onChange={handleChange}
            />
          </div>
          <div>
            <label>Ticket / Booking Number</label>
            <input
              type="text"
              name="ticketNumber"
              value={form.ticketNumber}
              onChange={handleChange}
            />
          </div>
        </div>

        <label>Gate Number</label>
        <input type="text" name="gateNumber" value={form.gateNumber} onChange={handleChange} />

        <label>Notes</label>
        <textarea name="notes" value={form.notes} onChange={handleChange} rows={3} />

        <button type="submit" className="btn btn-primary" disabled={loading}>
          {loading ? "Uploading..." : "Save Ticket"}
        </button>
      </form>
    </div>
  );
};

export default UploadTicket;

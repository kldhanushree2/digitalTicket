import { useState } from "react";
import { useNavigate } from "react-router-dom";
import ticketService from "../services/ticketService";
import extractionService from "../services/extractionService";

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

// The backend returns some fields as null when it couldn't confidently
// detect them (see ticketParser.js) - form inputs need "" instead, or
// React logs a warning about switching an input from uncontrolled to
// controlled.
const nullToEmpty = (value) => (value === null || value === undefined ? "" : value);

const UploadTicket = () => {
  const [form, setForm] = useState(initialFormState);
  const [file, setFile] = useState(null);
  const [preview, setPreview] = useState(null);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  // --- Auto-fill (Module 3 OCR/barcode extraction) state ---
  const [extracting, setExtracting] = useState(false);
  const [extractionNote, setExtractionNote] = useState("");
  const [autoFilled, setAutoFilled] = useState(false);

  const navigate = useNavigate();

  const handleChange = (e) => {
    setForm({ ...form, [e.target.name]: e.target.value });
  };

  const handleFileChange = async (e) => {
    const selected = e.target.files[0];
    setFile(selected);
    setExtractionNote("");
    setAutoFilled(false);

    if (!selected) {
      setPreview(null);
      return;
    }

    // Show an image preview when possible; PDFs just show the filename.
    if (selected.type.startsWith("image/")) {
      setPreview(URL.createObjectURL(selected));
    } else {
      setPreview(null);
    }

    // Automatically try to extract ticket details as soon as a file is
    // chosen - this is the "OCR + QR/Barcode Extraction" step from the
    // project spec's workflow, running right after upload and before the
    // user reviews/confirms. A failure here never blocks manual entry -
    // it just means the form stays empty for the user to fill in by hand.
    setExtracting(true);
    try {
      const extracted = await extractionService.extractTicketData(selected);

      if (extracted.note) {
        // e.g. "OCR for PDF tickets isn't supported yet" - informational,
        // not an error, so it doesn't use the error banner styling.
        setExtractionNote(extracted.note);
      } else {
        setForm((prev) => ({
          ...prev,
          eventName: extracted.eventName || prev.eventName,
          category: extracted.category || prev.category,
          date: nullToEmpty(extracted.date),
          time: nullToEmpty(extracted.time),
          venue: extracted.venue || prev.venue,
          seatNumber: extracted.seatNumber || prev.seatNumber,
          ticketNumber: extracted.ticketNumber || prev.ticketNumber,
          gateNumber: extracted.gateNumber || prev.gateNumber,
        }));
        setAutoFilled(true);
      }
    } catch {
      // Extraction is a nice-to-have, not a requirement - if it fails
      // (network hiccup, server briefly down, etc.) the user can still
      // fill in everything manually below.
      setExtractionNote("Couldn't auto-extract details from this file - please fill them in manually.");
    } finally {
      setExtracting(false);
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

        {extracting && (
          <p className="extraction-status">🔍 Scanning ticket for details...</p>
        )}
        {!extracting && autoFilled && (
          <p className="extraction-status extraction-success">
            ✨ Auto-filled from your ticket - please review before saving, OCR isn't always perfect.
          </p>
        )}
        {!extracting && extractionNote && (
          <p className="extraction-status">{extractionNote}</p>
        )}

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

        <button type="submit" className="btn btn-primary" disabled={loading || extracting}>
          {loading ? "Uploading..." : "Save Ticket"}
        </button>
      </form>
    </div>
  );
};

export default UploadTicket;

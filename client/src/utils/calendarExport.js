// Neither of these needs any OAuth or backend support - Google Calendar's
// "render" endpoint accepts a pre-filled event as URL parameters (the user
// still has to click "Save" on Google's own page, so we're never touching
// their calendar without consent), and .ics is a universal file format
// every calendar app (Google, Outlook, Apple Calendar) can import directly.

const getEventDateTime = (ticket) => {
  const start = new Date(ticket.date);
  if (ticket.time) {
    const [hours, minutes] = ticket.time.split(":").map(Number);
    start.setHours(hours || 0, minutes || 0, 0, 0);
  }
  // Assume a 1-hour duration by default since our Ticket model doesn't
  // store an explicit end time - reasonable for a calendar placeholder.
  const end = new Date(start.getTime() + 60 * 60 * 1000);
  return { start, end };
};

// Formats a Date as YYYYMMDDTHHMMSSZ, the format both Google Calendar URLs
// and .ics files expect for UTC timestamps.
const formatIcsDate = (date) => date.toISOString().replace(/[-:]/g, "").split(".")[0] + "Z";

export const buildGoogleCalendarUrl = (ticket) => {
  const { start, end } = getEventDateTime(ticket);

  const details = [
    ticket.venue && `Venue: ${ticket.venue}`,
    ticket.seatNumber && `Seat: ${ticket.seatNumber}`,
    ticket.ticketNumber && `Ticket #: ${ticket.ticketNumber}`,
  ]
    .filter(Boolean)
    .join("\n");

  const params = new URLSearchParams({
    action: "TEMPLATE",
    text: ticket.eventName,
    dates: `${formatIcsDate(start)}/${formatIcsDate(end)}`,
    details,
    location: ticket.venue || "",
  });

  return `https://calendar.google.com/calendar/render?${params.toString()}`;
};

const buildIcsContent = (ticket) => {
  const { start, end } = getEventDateTime(ticket);

  // .ics is a plain-text format with strict line-by-line rules - each of
  // these lines is a required or optional field in the VEVENT block.
  return [
    "BEGIN:VCALENDAR",
    "VERSION:2.0",
    "PRODID:-//DigitalTicket//EN",
    "BEGIN:VEVENT",
    `UID:${ticket._id}@digitalticket`,
    `DTSTAMP:${formatIcsDate(new Date())}`,
    `DTSTART:${formatIcsDate(start)}`,
    `DTEND:${formatIcsDate(end)}`,
    `SUMMARY:${ticket.eventName}`,
    ticket.venue ? `LOCATION:${ticket.venue}` : "",
    "END:VEVENT",
    "END:VCALENDAR",
  ]
    .filter(Boolean)
    .join("\r\n"); // .ics requires CRLF line endings per spec
};

// Triggers a browser download of a .ics file for the given ticket, without
// needing any backend endpoint - the file is built and downloaded entirely
// client-side.
export const downloadIcsFile = (ticket) => {
  const content = buildIcsContent(ticket);
  const blob = new Blob([content], { type: "text/calendar;charset=utf-8" });
  const url = URL.createObjectURL(blob);

  const link = document.createElement("a");
  link.href = url;
  link.download = `${ticket.eventName.replace(/[^a-z0-9]/gi, "_")}.ics`;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);

  URL.revokeObjectURL(url); // free the memory the Blob was using
};

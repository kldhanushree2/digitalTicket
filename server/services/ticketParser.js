// This is the "understanding" layer. OCR just gives us a blob of text -
// this file uses regular expressions and keyword matching to guess which
// line means what. It's intentionally forgiving: if a pattern doesn't
// match, that field is just left blank for the user to fill in manually.
// We NEVER assume the guesses are correct - the frontend always shows
// these as editable, pre-filled fields, not final data.

// Maps keywords found in the text to one of our category enum values
// (matches the "category" field in models/Ticket.js).
const CATEGORY_KEYWORDS = {
  Movie: ["movie", "cinema", "pvr", "inox", "cinemas"],
  Flight: ["flight", "airlines", "boarding pass", "airways", "pnr"],
  Train: ["train", "irctc", "railway", "pnr", "coach"],
  Bus: ["bus", "redbus", "travels"],
  Concert: ["concert", "live", "tour", "gig"],
  Sports: ["match", "stadium", "innings", "vs.", "tickets"],
  Conference: ["conference", "summit", "workshop", "seminar"],
};

// Tries to detect the event category by scanning for keywords.
// Case-insensitive; returns "Other" if nothing matches.
const detectCategory = (text) => {
  const lowerText = text.toLowerCase();

  for (const [category, keywords] of Object.entries(CATEGORY_KEYWORDS)) {
    if (keywords.some((keyword) => lowerText.includes(keyword))) {
      return category;
    }
  }

  return "Other";
};

// Looks for a line like "Date: 25 August 2026" or a standalone date such
// as "25/08/2026" or "2026-08-25". Returns an ISO date string (YYYY-MM-DD)
// or null if nothing looked like a date.
const extractDate = (text) => {
  // Pattern 1: "25 August 2026" / "25 Aug 2026"
  const longFormMatch = text.match(
    /(\d{1,2})\s+(January|February|March|April|May|June|July|August|September|October|November|December|Jan|Feb|Mar|Apr|Jun|Jul|Aug|Sep|Sept|Oct|Nov|Dec)\s+(\d{4})/i
  );
  if (longFormMatch) {
    const parsed = new Date(`${longFormMatch[1]} ${longFormMatch[2]} ${longFormMatch[3]}`);
    if (!isNaN(parsed.getTime())) {
      return parsed.toISOString().slice(0, 10);
    }
  }

  // Pattern 2: "25/08/2026" or "25-08-2026" (assumes DD/MM/YYYY, common in India)
  const slashMatch = text.match(/(\d{1,2})[\/\-](\d{1,2})[\/\-](\d{4})/);
  if (slashMatch) {
    const [, day, month, year] = slashMatch;
    const parsed = new Date(`${year}-${month.padStart(2, "0")}-${day.padStart(2, "0")}`);
    if (!isNaN(parsed.getTime())) {
      return parsed.toISOString().slice(0, 10);
    }
  }

  // Pattern 3: ISO-ish "2026-08-25"
  const isoMatch = text.match(/(\d{4})-(\d{1,2})-(\d{1,2})/);
  if (isoMatch) {
    const [, year, month, day] = isoMatch;
    const parsed = new Date(`${year}-${month.padStart(2, "0")}-${day.padStart(2, "0")}`);
    if (!isNaN(parsed.getTime())) {
      return parsed.toISOString().slice(0, 10);
    }
  }

  return null;
};

// Looks for a time like "07:30 PM" or "19:30". Returns "HH:MM" (24-hour)
// to match how we store `time` in the Ticket model, or null.
const extractTime = (text) => {
  // 12-hour format with AM/PM, e.g. "07:30 PM"
  const twelveHourMatch = text.match(/(\d{1,2}):(\d{2})\s*(AM|PM)/i);
  if (twelveHourMatch) {
    let [, hours, minutes, meridiem] = twelveHourMatch;
    hours = parseInt(hours, 10);
    if (meridiem.toUpperCase() === "PM" && hours !== 12) hours += 12;
    if (meridiem.toUpperCase() === "AM" && hours === 12) hours = 0;
    return `${String(hours).padStart(2, "0")}:${minutes}`;
  }

  // 24-hour format, e.g. "19:30" - only match if not already caught above
  const twentyFourHourMatch = text.match(/\b([01]?\d|2[0-3]):([0-5]\d)\b/);
  if (twentyFourHourMatch) {
    const [, hours, minutes] = twentyFourHourMatch;
    return `${hours.padStart(2, "0")}:${minutes}`;
  }

  return null;
};

// Generic helper: finds a line starting with a given label (e.g. "Seat:")
// and returns the text after the colon, trimmed. Case-insensitive.
const extractLabeledField = (text, labels) => {
  for (const label of labels) {
    const pattern = new RegExp(`${label}\\s*[:\\-]\\s*(.+)`, "i");
    const match = text.match(pattern);
    if (match) {
      // Stop at line breaks in case OCR ran two lines together
      return match[1].split("\n")[0].trim();
    }
  }
  return "";
};

// A lot of "tickets" users upload are actually screenshots of an app
// (RedBus, IRCTC, an airline app, etc.), not photos of a printed ticket.
// OCR reads the phone's status bar first - clock, signal bars, battery
// percentage - before it gets to any real content. Left unfiltered, that
// junk (e.g. "11:36 © © mR F al 019%") becomes the top candidate for our
// "first line" event-name fallback below. This filters lines that are
// mostly symbols/short fragments rather than real words, so the fallback
// skips past status-bar noise to the first line that actually looks like
// ticket content.
const isLikelyNoiseLine = (line) => {
  // A status bar line is short and has very little real alphabetic
  // content once you strip out digits, %, and symbols.
  const letters = line.replace(/[^a-zA-Z]/g, "");
  if (letters.length < 4) return true;

  // Classic clock+battery shape: "11:36 ... 19%" with little else.
  if (/^\d{1,2}:\d{2}\b.*\d{1,3}%?$/i.test(line) && letters.length < 8) return true;

  return false;
};

// Words that typically describe the VENUE/vendor rather than the actual
// event itself (a cinema chain's name, a generic "movie ticket" label).
// Used only to skip past branding text when guessing the event name -
// these words are still perfectly fine to appear elsewhere (e.g. category
// detection above deliberately DOES look for "cinema").
const BRANDING_WORDS = /\b(cinemas?|multiplex|movie\s*ticket|theatre|theater|box\s*office)\b/i;

// Takes raw OCR text (and optionally decoded barcode text) and returns
// a structured object matching the fields the frontend's upload form uses.
// Every field is a best-effort guess - the user reviews and corrects
// these before the ticket is actually saved via POST /api/tickets.
const parseTicketText = (ocrText, barcodeData = null) => {
  const lines = ocrText.split("\n").map((l) => l.trim()).filter(Boolean);
  const meaningfulLines = lines.filter((line) => !isLikelyNoiseLine(line));

  // Event name heuristic: prefer a line explicitly labeled "Movie:",
  // "Event:", or "Show:"; otherwise fall back to the first meaningful
  // line that ISN'T just venue branding (a cinema chain's name, a generic
  // "MOVIE TICKET" label) - the actual title is usually the next line
  // after that. Falls back further to the first meaningful line at all,
  // and finally the raw first line, if nothing better is found.
  const labeledEventName = extractLabeledField(ocrText, ["Movie", "Event", "Show", "Film"]);
  const brandingLine = meaningfulLines.find((line) => BRANDING_WORDS.test(line));
  const nonBrandingLine = meaningfulLines.find((line) => !BRANDING_WORDS.test(line));
  const eventName = labeledEventName || nonBrandingLine || meaningfulLines[0] || lines[0] || "";

  // Venue: prefer an explicit "Venue:"/"Location:" label. Many real tickets
  // (like a cinema ticket) never label the venue at all - they just print
  // the venue/chain name as a heading (e.g. "SUNRISE CINEMAS"), which is
  // exactly the branding-style line we skip past above when guessing the
  // event name. That same line is a solid fallback guess for venue.
  const labeledVenue = extractLabeledField(ocrText, ["Venue", "Location", "Theatre", "Theater"]);
  const venue = labeledVenue || brandingLine || "";

  // Ticket/booking numbers on real tickets are often printed as a bare
  // alphanumeric code with NO label at all (e.g. "SC250927B12",
  // "BMS123456") - typically near a barcode/QR graphic. This looks for a
  // standalone token that's a mix of uppercase letters AND digits, long
  // enough to be a real code rather than a coincidental short match, and
  // not something that's actually a date/time we've already parsed.
  const bareCodeMatch = ocrText.match(/\b(?=[A-Z0-9]{6,15}\b)(?=[A-Z0-9]*[A-Z])(?=[A-Z0-9]*\d)[A-Z0-9]{6,15}\b/);

  const ticketNumber =
    extractLabeledField(ocrText, [
      "Booking ID",
      "Ticket No",
      "Ticket Number",
      "Ticket #",
      "PNR",
      "Ref",
    ]) ||
    barcodeData ||
    (bareCodeMatch ? bareCodeMatch[0] : "");

  return {
    eventName,
    category: detectCategory(ocrText),
    date: extractDate(ocrText),
    time: extractTime(ocrText),
    venue,
    seatNumber: extractLabeledField(ocrText, ["Seat", "Seat No", "Seat Number"]),
    ticketNumber,
    gateNumber: extractLabeledField(ocrText, ["Gate", "Gate No", "Gate Number"]),
    rawOcrText: ocrText,
    barcodeData: barcodeData || "",
  };
};

module.exports = { parseTicketText, detectCategory, extractDate, extractTime };

const fs = require("fs");
const { extractTextFromImage } = require("../services/ocrService");
const { scanBarcode } = require("../services/barcodeService");
const { parseTicketText } = require("../services/ticketParser");

// @route   POST /api/extract
// @access  Private
// Accepts an uploaded image (field name "ticketFile", same as ticket
// creation) and returns SUGGESTED structured fields for the user to
// review and edit. This does NOT save anything to the database - saving
// still happens separately via POST /api/tickets, using whatever the
// user confirms on the review screen.
const extractTicketData = async (req, res) => {
  if (!req.file) {
    return res.status(400).json({ message: "An image file is required for extraction" });
  }

  const imagePath = req.file.path;

  try {
    // PDFs aren't supported for OCR in this version (see ocrService.js note) -
    // we still accept the upload but skip straight to an empty-fields response
    // so the user can fill things in manually rather than erroring out.
    if (req.file.mimetype === "application/pdf") {
      return res.status(200).json({
        eventName: "",
        category: "Other",
        date: null,
        time: null,
        venue: "",
        seatNumber: "",
        ticketNumber: "",
        gateNumber: "",
        rawOcrText: "",
        barcodeData: "",
        note: "OCR for PDF tickets isn't supported yet - please fill in the details manually.",
      });
    }

    // Run OCR and barcode scanning in parallel since they're independent -
    // this is faster than doing them one after another.
    const [ocrText, barcodeData] = await Promise.all([
      extractTextFromImage(imagePath),
      scanBarcode(imagePath),
    ]);

    const structuredData = parseTicketText(ocrText, barcodeData);

    res.status(200).json(structuredData);
  } catch (error) {
    res.status(500).json({ message: "Extraction failed", error: error.message });
  } finally {
    // This endpoint only extracts data - it doesn't create a ticket record,
    // so we don't need to keep the uploaded file around. Clean it up.
    // (When the user confirms and calls POST /api/tickets, they'll need to
    // upload the file again there - see the frontend note in Step 5 below.)
    if (fs.existsSync(imagePath)) {
      fs.unlinkSync(imagePath);
    }
  }
};

module.exports = { extractTicketData };

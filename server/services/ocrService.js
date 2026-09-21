const path = require("path");
const Tesseract = require("tesseract.js");

// By default, Tesseract.js downloads its language training data from a
// public CDN the first time it runs. That's unreliable on restricted
// networks (campus Wi-Fi, corporate firewalls, China, etc.) and adds a
// network dependency to something that should work offline. Instead, we
// installed @tesseract.js-data/eng as a normal npm package and point
// Tesseract at it directly, so OCR works with zero internet access.
const LANG_DATA_PATH = path.join(
  __dirname,
  "..",
  "node_modules",
  "@tesseract.js-data",
  "eng",
  "4.0.0_best_int"
);

// Runs OCR on an image file and returns the raw extracted text.
// This is intentionally "dumb" - it doesn't try to understand the text,
// just converts pixels into a string. Understanding happens in ticketParser.js.
//
// Note: Tesseract reads image formats directly (JPG/PNG). PDFs are skipped
// here - a production version would first render the PDF's first page to
// an image before OCR; for this project we OCR images only.
const extractTextFromImage = async (imagePath) => {
  try {
    const {
      data: { text },
    } = await Tesseract.recognize(imagePath, "eng", {
      langPath: LANG_DATA_PATH,
      gzip: true,
      // logger can print progress (0 to 1) during recognition - useful
      // for debugging slow OCR runs, silent by default here.
      logger: () => {},
    });

    return text.trim();
  } catch (error) {
    console.error("OCR error:", error.message);
    throw new Error("Failed to extract text from image");
  }
};

module.exports = { extractTextFromImage };

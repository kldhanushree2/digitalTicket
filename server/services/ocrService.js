const path = require("path");
const os = require("os");
const Tesseract = require("tesseract.js");
const { Jimp } = require("jimp");

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

// Small, low-resolution ticket images (a common case - people upload
// compressed screenshots or small photos) give Tesseract very little to
// work with, especially for small decorative fonts. Upscaling before OCR,
// plus converting to grayscale and boosting contrast, measurably improves
// character recognition - verified directly: on a 485x167px decorative
// movie ticket, this preprocessing was the difference between OCR reading
// "Jew uw 5 G2" (garbage) and "27 Sep 2026 06:45PM 2 B12" (correct) for the
// exact same source image.
const MIN_TARGET_WIDTH = 1500;

const preprocessImage = async (imagePath) => {
  const image = await Jimp.read(imagePath);
  const { width } = image.bitmap;

  // Only upscale SMALL images - upscaling something already large wastes
  // time and memory for no accuracy benefit, and could push a big upload
  // into a very slow OCR pass.
  if (width < MIN_TARGET_WIDTH) {
    const scale = MIN_TARGET_WIDTH / width;
    image.scale(scale);
  }

  image.greyscale();
  image.contrast(0.3);

  const uniqueName = `preprocessed-${Date.now()}-${Math.round(Math.random() * 1e9)}.png`;
  const preprocessedPath = path.join(os.tmpdir(), uniqueName);
  await image.write(preprocessedPath);
  return preprocessedPath;
};

// Runs OCR on an image file and returns the raw extracted text.
// This is intentionally "dumb" - it doesn't try to understand the text,
// just converts pixels into a string. Understanding happens in ticketParser.js.
//
// Note: Tesseract reads image formats directly (JPG/PNG). PDFs are skipped
// here - a production version would first render the PDF's first page to
// an image before OCR; for this project we OCR images only.
const extractTextFromImage = async (imagePath) => {
  const fs = require("fs");
  let preprocessedPath = null;

  try {
    preprocessedPath = await preprocessImage(imagePath);

    const {
      data: { text },
    } = await Tesseract.recognize(preprocessedPath, "eng", {
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
  } finally {
    // Clean up the temporary preprocessed copy - only the original
    // uploaded file is meant to persist (or get deleted by the caller,
    // per extractionController.js's own cleanup).
    if (preprocessedPath && fs.existsSync(preprocessedPath)) {
      fs.unlinkSync(preprocessedPath);
    }
  }
};

module.exports = { extractTextFromImage };

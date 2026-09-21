const { Jimp } = require("jimp");
const {
  RGBLuminanceSource,
  BinaryBitmap,
  HybridBinarizer,
  MultiFormatReader,
} = require("@zxing/library");

// ZXing's JS port was built primarily for the browser, where you feed it
// pixels straight from a <canvas>. In Node there's no canvas, so we load
// the image with Jimp (pure JS, works everywhere) and manually convert
// its RGBA pixel buffer into the packed-RGB Int32Array format ZXing expects.
const imageToLuminanceSource = (image) => {
  const { width, height, data } = image.bitmap; // data = Buffer of [R,G,B,A, R,G,B,A, ...]

  const rgbData = new Int32Array(width * height);
  for (let i = 0; i < width * height; i++) {
    const r = data[i * 4];
    const g = data[i * 4 + 1];
    const b = data[i * 4 + 2];
    // Pack into a single 24-bit RGB integer, e.g. 0x00RRGGBB
    rgbData[i] = (r << 16) | (g << 8) | b;
  }

  return new RGBLuminanceSource(rgbData, width, height);
};

// Attempts to find and decode a QR code or barcode in the given image file.
// Returns the decoded string, or null if none was found (this is normal -
// not every ticket has a visible barcode, so we never throw for that case).
const scanBarcode = async (imagePath) => {
  try {
    const image = await Jimp.read(imagePath);
    const luminanceSource = imageToLuminanceSource(image);
    const binaryBitmap = new BinaryBitmap(new HybridBinarizer(luminanceSource));

    const reader = new MultiFormatReader();
    const result = reader.decode(binaryBitmap);

    return result.getText();
  } catch (error) {
    // NotFoundException is ZXing's normal "nothing here" signal, not a bug.
    if (error.name === "NotFoundException") {
      return null;
    }
    // Any other error (corrupt file, unreadable format) - log it but still
    // don't crash the whole extraction request over a missing barcode.
    console.error("Barcode scan error:", error.message);
    return null;
  }
};

module.exports = { scanBarcode };

const multer = require("multer");
const path = require("path");
const fs = require("fs");

const allowedMimeTypes = ["image/jpeg", "image/jpg", "image/png", "application/pdf"];

const fileFilter = (req, file, cb) => {
  if (allowedMimeTypes.includes(file.mimetype)) {
    cb(null, true);
  } else {
    cb(new Error("Unsupported file type. Only JPG, JPEG, PNG, and PDF are allowed."));
  }
};

// Whether to use Cloudinary is controlled entirely by whether its env vars
// are set. Locally (no Cloudinary account configured), files save to
// server/uploads/ exactly as they always have - Module 2's behavior is
// completely unchanged for local development. In production (Render etc.),
// setting these three env vars switches storage to Cloudinary automatically,
// because Render's own disk is wiped on every redeploy - anything saved to
// uploads/ there would be lost the next time the server restarts.
const useCloudinary = Boolean(
  process.env.CLOUDINARY_CLOUD_NAME && process.env.CLOUDINARY_API_KEY && process.env.CLOUDINARY_API_SECRET
);

let storage;

if (useCloudinary) {
  const cloudinary = require("cloudinary").v2;
  const { CloudinaryStorage } = require("multer-storage-cloudinary");

  cloudinary.config({
    cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
    api_key: process.env.CLOUDINARY_API_KEY,
    api_secret: process.env.CLOUDINARY_API_SECRET,
  });

  storage = new CloudinaryStorage({
    cloudinary,
    params: {
      folder: "digitalticket",
      // "auto" lets Cloudinary correctly handle both images AND PDFs -
      // forcing resource_type: "image" would break PDF uploads.
      resource_type: "auto",
    },
  });

  console.log("File storage: Cloudinary (production mode)");
} else {
  const uploadDir = path.join(__dirname, "..", "uploads");
  if (!fs.existsSync(uploadDir)) {
    fs.mkdirSync(uploadDir, { recursive: true });
  }

  storage = multer.diskStorage({
    destination: (req, file, cb) => {
      cb(null, uploadDir);
    },
    filename: (req, file, cb) => {
      const uniqueSuffix = Date.now() + "-" + Math.round(Math.random() * 1e9);
      const ext = path.extname(file.originalname);
      cb(null, `${uniqueSuffix}${ext}`);
    },
  });

  console.log("File storage: local disk (development mode)");
}

const upload = multer({
  storage,
  fileFilter,
  limits: {
    fileSize: 10 * 1024 * 1024,
  },
});

// A SEPARATE upload instance that always uses local disk, regardless of
// Cloudinary configuration. Used only by the extraction endpoint (Module 3),
// where the file is needed briefly for OCR/barcode scanning and then
// deleted immediately - uploading it to Cloudinary first would be a wasted
// round-trip (upload, then instantly delete) and OCR needs simple local
// file access. Ticket creation (above) is the one that needs the file to
// actually persist, so that's the one that goes to Cloudinary in production.
const localUploadDir = path.join(__dirname, "..", "uploads");
if (!fs.existsSync(localUploadDir)) {
  fs.mkdirSync(localUploadDir, { recursive: true });
}

const localStorage = multer.diskStorage({
  destination: (req, file, cb) => cb(null, localUploadDir),
  filename: (req, file, cb) => {
    const uniqueSuffix = Date.now() + "-" + Math.round(Math.random() * 1e9);
    cb(null, `extract-${uniqueSuffix}${path.extname(file.originalname)}`);
  },
});

const localOnlyUpload = multer({
  storage: localStorage,
  fileFilter,
  limits: { fileSize: 10 * 1024 * 1024 },
});

module.exports = upload;
module.exports.useCloudinary = useCloudinary;
module.exports.localOnlyUpload = localOnlyUpload;

const express = require("express");
const router = express.Router();
const { protect } = require("../middleware/authMiddleware");
const upload = require("../middleware/uploadMiddleware");
const { extractTicketData } = require("../controllers/extractionController");

// Uses localOnlyUpload (always disk storage, regardless of Cloudinary
// config) since this file is only needed briefly for OCR and is deleted
// right after - see the comment in uploadMiddleware.js for why.
router.post("/", protect, upload.localOnlyUpload.single("ticketFile"), extractTicketData);

module.exports = router;

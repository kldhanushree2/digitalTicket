const mongoose = require("mongoose");

const ticketSchema = new mongoose.Schema(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
      index: true,
    },
    eventName: {
      type: String,
      required: [true, "Event name is required"],
      trim: true,
    },
    category: {
      type: String,
      enum: ["Movie", "Flight", "Train", "Bus", "Concert", "Sports", "Conference", "Other"],
      default: "Other",
    },
    date: {
      type: Date,
      required: [true, "Event date is required"],
    },
    time: {
      type: String,
      trim: true,
    },
    venue: {
      type: String,
      trim: true,
    },
    seatNumber: {
      type: String,
      trim: true,
    },
    ticketNumber: {
      type: String,
      trim: true,
    },
    gateNumber: {
      type: String,
      trim: true,
    },
    notes: {
      type: String,
      trim: true,
    },
    fileName: {
      type: String,
      required: true,
    },
    originalFileName: {
      type: String,
    },
    fileUrl: {
      type: String,
      required: true,
    },
    fileType: {
      type: String,
    },
    fileSize: {
      type: Number,
    },
    // Which storage backend this specific file lives in. Stored per-ticket
    // (not just read from an env var) so that if you ever switch a
    // deployment from local disk to Cloudinary, OLD tickets uploaded before
    // the switch still know how to correctly delete their own file later -
    // a global "current mode" flag would get this wrong for pre-existing data.
    storageProvider: {
      type: String,
      enum: ["local", "cloudinary"],
      default: "local",
    },
    // Only set when storageProvider is "cloudinary" - needed to delete the
    // file from Cloudinary later (Cloudinary deletes by public_id, not URL).
    cloudinaryPublicId: {
      type: String,
    },
    ocrText: {
      type: String,
      default: "",
    },
    barcodeData: {
      type: String,
      default: "",
    },
  },
  {
    timestamps: true,
  }
);

module.exports = mongoose.model("Ticket", ticketSchema);

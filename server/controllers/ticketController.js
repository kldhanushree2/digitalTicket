const Ticket = require("../models/Ticket");
const fs = require("fs");
const upload = require("../middleware/uploadMiddleware");
const { deleteTicketFile } = require("../utils/fileCleanup");

// Deletes an orphaned upload if we reject the request AFTER multer already
// saved the file (e.g. missing required fields). Branches on storage mode
// since a Cloudinary "path" is a URL, not a local path fs can unlink.
const cleanupRejectedUpload = async (file) => {
  if (upload.useCloudinary) {
    try {
      const cloudinary = require("cloudinary").v2;
      await cloudinary.uploader.destroy(file.filename, { resource_type: "auto" });
    } catch (error) {
      console.error("Failed to clean up rejected Cloudinary upload:", error.message);
    }
  } else if (fs.existsSync(file.path)) {
    fs.unlinkSync(file.path);
  }
};

const createTicket = async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ message: "Ticket file is required" });
    }

    const { eventName, category, date, time, venue, seatNumber, ticketNumber, gateNumber, notes } =
      req.body;

    if (!eventName || !date) {
      await cleanupRejectedUpload(req.file);
      return res.status(400).json({ message: "eventName and date are required" });
    }

    // req.file's shape differs by storage backend:
    // - local disk: { filename: "123-abc.jpg", path: "/full/local/path" }
    // - Cloudinary:  { filename: "<public_id>", path: "<secure_url>" }
    // See uploadMiddleware.js and utils/fileCleanup.js for the full picture.
    const ticket = await Ticket.create({
      userId: req.user._id,
      eventName,
      category,
      date,
      time,
      venue,
      seatNumber,
      ticketNumber,
      gateNumber,
      notes,
      fileName: req.file.filename,
      originalFileName: req.file.originalname,
      fileUrl: upload.useCloudinary ? req.file.path : `/uploads/${req.file.filename}`,
      fileType: req.file.mimetype,
      fileSize: req.file.size,
      storageProvider: upload.useCloudinary ? "cloudinary" : "local",
      cloudinaryPublicId: upload.useCloudinary ? req.file.filename : undefined,
    });

    res.status(201).json(ticket);
  } catch (error) {
    res.status(500).json({ message: "Server error", error: error.message });
  }
};

const getTickets = async (req, res) => {
  try {
    const tickets = await Ticket.find({ userId: req.user._id }).sort({ date: 1 });
    res.status(200).json(tickets);
  } catch (error) {
    res.status(500).json({ message: "Server error", error: error.message });
  }
};

const getTicketById = async (req, res) => {
  try {
    const ticket = await Ticket.findById(req.params.id);

    if (!ticket) {
      return res.status(404).json({ message: "Ticket not found" });
    }

    if (ticket.userId.toString() !== req.user._id.toString()) {
      return res.status(403).json({ message: "Not authorized to access this ticket" });
    }

    res.status(200).json(ticket);
  } catch (error) {
    res.status(500).json({ message: "Server error", error: error.message });
  }
};

const updateTicket = async (req, res) => {
  try {
    const ticket = await Ticket.findById(req.params.id);

    if (!ticket) {
      return res.status(404).json({ message: "Ticket not found" });
    }

    if (ticket.userId.toString() !== req.user._id.toString()) {
      return res.status(403).json({ message: "Not authorized to modify this ticket" });
    }

    const allowedFields = [
      "eventName",
      "category",
      "date",
      "time",
      "venue",
      "seatNumber",
      "ticketNumber",
      "gateNumber",
      "notes",
    ];

    allowedFields.forEach((field) => {
      if (req.body[field] !== undefined) {
        ticket[field] = req.body[field];
      }
    });

    const updatedTicket = await ticket.save();
    res.status(200).json(updatedTicket);
  } catch (error) {
    res.status(500).json({ message: "Server error", error: error.message });
  }
};

const deleteTicket = async (req, res) => {
  try {
    const ticket = await Ticket.findById(req.params.id);

    if (!ticket) {
      return res.status(404).json({ message: "Ticket not found" });
    }

    if (ticket.userId.toString() !== req.user._id.toString()) {
      return res.status(403).json({ message: "Not authorized to delete this ticket" });
    }

    await deleteTicketFile(ticket);
    await ticket.deleteOne();
    res.status(200).json({ message: "Ticket deleted successfully" });
  } catch (error) {
    res.status(500).json({ message: "Server error", error: error.message });
  }
};

module.exports = { createTicket, getTickets, getTicketById, updateTicket, deleteTicket };

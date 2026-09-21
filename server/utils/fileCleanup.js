const fs = require("fs");
const path = require("path");

// Deletes a ticket's underlying file, wherever it actually lives.
// Used by both ticketController.js (single ticket delete) and
// authController.js (cascading delete when an account is removed) -
// kept in one place so both stay in sync if storage logic ever changes.
const deleteTicketFile = async (ticket) => {
  if (ticket.storageProvider === "cloudinary" && ticket.cloudinaryPublicId) {
    try {
      const cloudinary = require("cloudinary").v2;
      // resource_type: "auto" on upload means Cloudinary may have stored
      // this as "image" or "raw" (e.g. PDFs) - "auto" also works for delete.
      await cloudinary.uploader.destroy(ticket.cloudinaryPublicId, { resource_type: "auto" });
    } catch (error) {
      // Don't let a failed cloud cleanup block the actual delete operation -
      // worst case is one orphaned file in Cloudinary, which is far less
      // harmful than refusing to let the user delete their own ticket/account.
      console.error("Cloudinary file deletion failed:", error.message);
    }
    return;
  }

  // Local disk storage (development mode)
  const filePath = path.join(__dirname, "..", "uploads", ticket.fileName);
  if (fs.existsSync(filePath)) {
    fs.unlinkSync(filePath);
  }
};

module.exports = { deleteTicketFile };

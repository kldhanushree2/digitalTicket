import api from "./api";

// Calls the Module 3 backend endpoint that runs OCR + barcode scanning on
// an uploaded image and returns SUGGESTED fields. This never saves
// anything - it's purely "here's my best guess", and the Upload page
// always lets the user review/edit before the actual save (POST /tickets).
export const extractTicketData = async (file) => {
  const formData = new FormData();
  formData.append("ticketFile", file);

  const response = await api.post("/extract", formData, {
    headers: { "Content-Type": "multipart/form-data" },
  });

  return response.data;
};

export default { extractTicketData };

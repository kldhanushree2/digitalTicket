import api from "./api";

// Ticket creation needs multipart/form-data because we're sending a
// file alongside text fields. ticketData is a plain JS object here;
// we convert it into FormData before sending.
export const createTicket = async (ticketData, file) => {
  const formData = new FormData();

  // Field name "ticketFile" must match upload.single("ticketFile")
  // in server/routes/ticketRoutes.js exactly.
  formData.append("ticketFile", file);

  Object.keys(ticketData).forEach((key) => {
    if (ticketData[key] !== undefined && ticketData[key] !== "") {
      formData.append(key, ticketData[key]);
    }
  });

  const response = await api.post("/tickets", formData, {
    headers: { "Content-Type": "multipart/form-data" },
  });
  return response.data;
};

export const getTickets = async () => {
  const response = await api.get("/tickets");
  return response.data;
};

export const getTicketById = async (id) => {
  const response = await api.get(`/tickets/${id}`);
  return response.data;
};

export const updateTicket = async (id, updates) => {
  const response = await api.put(`/tickets/${id}`, updates);
  return response.data;
};

export const deleteTicket = async (id) => {
  const response = await api.delete(`/tickets/${id}`);
  return response.data;
};

// Also export everything bundled as one default object, so pages can
// write `import ticketService from "./ticketService"` and call
// ticketService.getTickets() etc., instead of naming each import.
export default { createTicket, getTickets, getTicketById, updateTicket, deleteTicket };

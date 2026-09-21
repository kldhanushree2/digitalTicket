import api from "./api";

// Each function here maps directly to one backend endpoint from
// server/routes/authRoutes.js. Components never call axios directly -
// they call these functions, which keeps API details in one place.

export const register = async (name, email, password) => {
  const response = await api.post("/auth/register", { name, email, password });
  return response.data; // { _id, name, email, token }
};

export const login = async (email, password) => {
  const response = await api.post("/auth/login", { email, password });
  return response.data; // { _id, name, email, token }
};

export const getProfile = async () => {
  const response = await api.get("/auth/profile");
  return response.data; // { _id, name, email, createdAt }
};

export const updateProfile = async (updates) => {
  const response = await api.put("/auth/profile", updates);
  return response.data;
};

export const changePassword = async (currentPassword, newPassword) => {
  const response = await api.put("/auth/change-password", { currentPassword, newPassword });
  return response.data;
};

export const deleteAccount = async (password) => {
  const response = await api.delete("/auth/account", { data: { password } });
  return response.data;
};

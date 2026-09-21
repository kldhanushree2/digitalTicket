import axios from "axios";

// One shared Axios instance for the whole app, pointed at our backend.
// Every service file (authService, ticketService) imports this instead
// of creating its own axios calls, so the base URL only lives in one place.
//
// VITE_API_URL is read at BUILD time (Vite bakes it into the built JS,
// there's no server-side runtime for a static Vercel deployment to read
// env vars from). Locally, with no .env file, it falls back to your
// backend running on localhost - exactly Module 1-7's existing behavior.
// In production, set VITE_API_URL in Vercel's project settings to your
// deployed Render backend's URL, e.g. https://digitalticket-api.onrender.com/api
const api = axios.create({
  baseURL: import.meta.env.VITE_API_URL || "http://localhost:5000/api",
});

// This runs before every single request made with `api`.
// It reads the token we saved in localStorage at login and attaches it
// as "Authorization: Bearer <token>" - exactly what our backend's
// authMiddleware.js expects. Without this, every protected route
// (tickets, profile) would fail with 401.
api.interceptors.request.use((config) => {
  const token = localStorage.getItem("token");
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

export default api;

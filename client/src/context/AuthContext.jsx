import { createContext, useContext, useState, useEffect } from "react";
import * as authService from "../services/authService";

// Context lets us avoid passing "user" and "login"/"logout" functions
// down through every single component by hand (prop drilling).
// Any component can call useAuth() to read/change login state directly.
const AuthContext = createContext(null);

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  // On first load (e.g. page refresh), check if we already have a
  // token saved from a previous session, and if so, restore the user.
  useEffect(() => {
    const restoreSession = async () => {
      const token = localStorage.getItem("token");
      if (token) {
        try {
          const profile = await authService.getProfile();
          setUser(profile);
        } catch (error) {
          // Token expired or invalid - clear it so we don't keep retrying
          localStorage.removeItem("token");
        }
      }
      setLoading(false);
    };
    restoreSession();
  }, []);

  const login = async (email, password) => {
    const data = await authService.login(email, password);
    localStorage.setItem("token", data.token);
    setUser({ _id: data._id, name: data.name, email: data.email });
    return data;
  };

  const register = async (name, email, password) => {
    const data = await authService.register(name, email, password);
    localStorage.setItem("token", data.token);
    setUser({ _id: data._id, name: data.name, email: data.email });
    return data;
  };

  const logout = () => {
    localStorage.removeItem("token");
    setUser(null);
  };

  // Lets pages (like Profile) push a fresh user object into context after
  // an edit, without needing to re-login or re-fetch /profile separately.
  const updateUser = (updatedFields) => {
    setUser((prev) => ({ ...prev, ...updatedFields }));
  };

  return (
    <AuthContext.Provider value={{ user, loading, login, register, logout, updateUser }}>
      {children}
    </AuthContext.Provider>
  );
};

// Custom hook so components write: const { user, login } = useAuth();
// instead of importing useContext + AuthContext everywhere.
export const useAuth = () => useContext(AuthContext);

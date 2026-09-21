import { Navigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";

// Wraps any page that should only be visible to logged-in users.
// If there's no user, redirect to /login instead of rendering the page.
// While we're still checking localStorage on first load, show nothing
// (avoids a flash of the login page before the session restore finishes).
const ProtectedRoute = ({ children }) => {
  const { user, loading } = useAuth();

  if (loading) {
    return <div className="page-center">Loading...</div>;
  }

  if (!user) {
    return <Navigate to="/login" replace />;
  }

  return children;
};

export default ProtectedRoute;

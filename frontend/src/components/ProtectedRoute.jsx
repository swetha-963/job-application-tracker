import { Navigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";

export default function ProtectedRoute({ children }) {
  const { user, loading } = useAuth();
  if (loading) {
    return (
      <div className="app-loading">
        <span className="loading-mark" />
        <p>Loading your workspace</p>
      </div>
    );
  }
  return user ? children : <Navigate to="/login" replace />;
}

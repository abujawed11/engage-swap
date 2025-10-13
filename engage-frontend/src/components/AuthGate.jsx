import { useEffect, useState } from "react";
import { Navigate } from "react-router-dom";
import { getToken, auth } from "../lib/api";
import { useApp } from "../lib/appState";

export default function AuthGate({ children }) {
  const { user, setUser } = useApp();
  const [loading, setLoading] = useState(true);
  const token = getToken();

  useEffect(() => {
    // If no token, don't bother fetching user
    if (!token) {
      setLoading(false);
      return;
    }

    // If user already loaded, skip
    if (user) {
      setLoading(false);
      return;
    }

    // Fetch user profile with token
    const fetchUser = async () => {
      try {
        const userData = await auth.me();
        setUser(userData);
      } catch (err) {
        // Token invalid or expired, clear it
        console.warn("Failed to fetch user:", err.message);
        setUser(null);
      } finally {
        setLoading(false);
      }
    };

    fetchUser();
  }, [token, user, setUser]);

  // Show loading state while fetching user
  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <p className="text-slate-600">Loading...</p>
      </div>
    );
  }

  // Redirect to login if not authenticated
  if (!token || !user) {
    return <Navigate to="/login" replace />;
  }

  // Render protected content
  return children;
}

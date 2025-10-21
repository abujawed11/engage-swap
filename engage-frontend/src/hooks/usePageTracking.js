import { useEffect } from "react";
import { useLocation } from "react-router-dom";
import { pageview } from "../lib/ga";

export default function usePageTracking() {
  const location = useLocation();

  useEffect(() => {
    const path = location.pathname + location.search;

    // Optional: skip tracking private/admin routes
    const skipPaths = [
      "/admin",
      "/dashboard",
      "/wallet",
      "/analytics",
      "/login",
      "/signup",
    ];
    const shouldSkip = skipPaths.some((p) => path.startsWith(p));
    if (!shouldSkip) pageview(path);
  }, [location]);
}

import { useEffect } from "react";
import { useLocation } from "react-router-dom";
import { injectSpeedInsights } from "@vercel/speed-insights";

export default function SpeedInsightsListener() {
  const location = useLocation();

  useEffect(() => {
    // Report the current route to Vercel Speed Insights on every navigation
    injectSpeedInsights({ route: location.pathname });
  }, [location.pathname]);

  return null;
}

// src/pages/Gateway.jsx - Enhanced version with popup window tracking and configurable watch duration
import { useEffect, useState, useRef } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import Card from "../components/ui/Card";
import Button from "../components/ui/Button";
import { earn as earnAPI } from "../lib/api";
import { useApp } from "../lib/appState";
import { formatCoins, formatCoinsValue } from "../lib/coins";

const HEARTBEAT_INTERVAL = 5000; // Send metrics every 5 seconds

export default function Gateway() {
  const location = useLocation();
  const navigate = useNavigate();
  const { user, setUser } = useApp();

  const { campaign, verificationToken } = location.state || {};

  // Get required watch duration from campaign (default to 30s if not set)
  const requiredDuration = campaign?.watch_duration || 30;

  // Visitor earns the base coins_per_visit (not the total campaign cost)
  const coinsToEarn = campaign?.coins_per_visit || 0;

  // Time tracking
  const [activeTime, setActiveTime] = useState(0);
  const [isPaused, setIsPaused] = useState(true); // Start paused (user is on our page, not popup)
  const [isComplete, setIsComplete] = useState(false);

  // Activity tracking (kept for analytics but not used for reward tier anymore)
  const [mouseMovements, setMouseMovements] = useState(0);
  const [lastMousePos, setLastMousePos] = useState({ x: 0, y: 0 });

  // Popup tracking
  const [popupOpen, setPopupOpen] = useState(false);
  const [popupClosed, setPopupClosed] = useState(false);
  const popupRef = useRef(null);
  const popupMonitorRef = useRef(null);

  // UI state
  const [isClaiming, setIsClaiming] = useState(false);
  const [error, setError] = useState("");

  // Refs
  const intervalRef = useRef(null);
  const heartbeatRef = useRef(null);

  // Redirect if no token
  useEffect(() => {
    if (!campaign || !verificationToken) {
      navigate("/earn", { replace: true });
    }
  }, [campaign, verificationToken, navigate]);

  // Open popup automatically on mount - with small delay to avoid race conditions
  useEffect(() => {
    if (campaign && !popupRef.current) {
      // Small delay to ensure page is fully loaded
      const timer = setTimeout(() => {
        openPopup();
      }, 100);

      return () => clearTimeout(timer);
    }

    // Cleanup: close popup on unmount
    return () => {
      if (popupRef.current && !popupRef.current.closed) {
        popupRef.current.close();
      }
      if (popupMonitorRef.current) {
        clearInterval(popupMonitorRef.current);
      }
    };
  }, [campaign]);

  const openPopup = () => {
    try {
      // Open popup with specific dimensions
      const width = 1200;
      const height = 800;
      const left = window.screen.width / 2 - width / 2;
      const top = window.screen.height / 2 - height / 2;

      popupRef.current = window.open(
        campaign.url,
        `campaign_${campaign.id}`,
        `width=${width},height=${height},left=${left},top=${top},toolbar=no,location=yes,status=yes,menubar=no,scrollbars=yes,resizable=yes`
      );

      if (popupRef.current) {
        setPopupOpen(true);
        setPopupClosed(false);
        // When popup opens, user's focus moves to it → start timer
        setIsPaused(false);
        startPopupMonitoring();
      } else {
        setError("Popup was blocked. Please allow popups for this site and try again.");
      }
    } catch (err) {
      setError("Failed to open popup. Please check your popup blocker settings.");
      console.error("Popup error:", err);
    }
  };

  // Monitor popup state
  const startPopupMonitoring = () => {
    if (popupMonitorRef.current) {
      clearInterval(popupMonitorRef.current);
    }

    popupMonitorRef.current = setInterval(() => {
      if (popupRef.current && popupRef.current.closed) {
        setPopupOpen(false);
        setPopupClosed(true);
        setIsPaused(true);
        clearInterval(popupMonitorRef.current);
      }
    }, 500);
  };

  // Page Visibility API: REVERSED LOGIC
  // Timer runs when user is viewing the POPUP (campaign), not our page
  useEffect(() => {
    const handleVisibilityChange = () => {
      // When OUR page is visible, user is NOT viewing popup → PAUSE
      // When OUR page is hidden, user is likely viewing popup → RUN
      if (document.hidden && popupOpen && !popupClosed) {
        setIsPaused(false); // User switched to popup → COUNT
      } else {
        setIsPaused(true); // User is on our page → PAUSE
      }
    };

    const handleFocus = () => {
      // User focused OUR page → they're NOT viewing popup → PAUSE
      setIsPaused(true);
    };

    const handleBlur = () => {
      // User left OUR page → likely viewing popup → COUNT
      if (popupOpen && !popupClosed) {
        setIsPaused(false);
      }
    };

    document.addEventListener("visibilitychange", handleVisibilityChange);
    window.addEventListener("focus", handleFocus);
    window.addEventListener("blur", handleBlur);

    return () => {
      document.removeEventListener("visibilitychange", handleVisibilityChange);
      window.removeEventListener("focus", handleFocus);
      window.removeEventListener("blur", handleBlur);
    };
  }, [popupOpen, popupClosed]);

  // Mouse movement tracking
  useEffect(() => {
    const handleMouseMove = (e) => {
      const dx = e.clientX - lastMousePos.x;
      const dy = e.clientY - lastMousePos.y;
      const distance = Math.sqrt(dx * dx + dy * dy);

      if (distance > 10) {
        setMouseMovements((prev) => prev + 1);
        setLastMousePos({ x: e.clientX, y: e.clientY });
      }
    };

    window.addEventListener("mousemove", handleMouseMove);
    return () => window.removeEventListener("mousemove", handleMouseMove);
  }, [lastMousePos]);

  // Timer: increment active time every second
  useEffect(() => {
    if (isPaused || isComplete || !popupOpen) {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
        intervalRef.current = null;
      }
      return;
    }

    intervalRef.current = setInterval(() => {
      setActiveTime((prev) => {
        const newTime = prev + 1;

        // Check if user has reached the required watch duration
        if (newTime >= requiredDuration) {
          setIsComplete(true);
        }

        return newTime;
      });
    }, 1000);

    return () => {
      if (intervalRef.current) clearInterval(intervalRef.current);
    };
  }, [isPaused, isComplete, requiredDuration, popupOpen]);

  // Heartbeat: send metrics to backend every 5 seconds
  useEffect(() => {
    if (!verificationToken || isComplete) return;

    heartbeatRef.current = setInterval(async () => {
      try {
        await earnAPI.sendHeartbeat({
          token: verificationToken,
          activeTime,
          mouseMovements,
          verificationPassed: false, // Not used anymore but kept for backwards compatibility
        });
      } catch (err) {
        console.error("Heartbeat failed:", err);
      }
    }, HEARTBEAT_INTERVAL);

    return () => {
      if (heartbeatRef.current) clearInterval(heartbeatRef.current);
    };
  }, [verificationToken, activeTime, mouseMovements, isComplete]);

  const progress = (activeTime / requiredDuration) * 100;
  const canClaim = isComplete;

  const handleClaim = async () => {
    if (!canClaim || isClaiming) return;

    setIsClaiming(true);
    setError("");

    try {
      const data = await earnAPI.claimReward(verificationToken, {
        activeTime,
        mouseMovements,
        verificationPassed: false, // Not used anymore
        rewardTier: "active", // Not used anymore, but kept for backwards compatibility
      });

      if (user) {
        setUser({ ...user, coins: data.new_balance });
      }

      // Close popup if still open
      if (popupRef.current && !popupRef.current.closed) {
        popupRef.current.close();
      }

      navigate("/earn", {
        replace: true,
        state: {
          showToast: true,
          earnedCoins: data.coins_earned,
        },
      });
    } catch (err) {
      setError(err.message || "Failed to claim reward");
      setIsClaiming(false);
    }
  };

  const handleCancel = () => {
    if (popupRef.current && !popupRef.current.closed) {
      popupRef.current.close();
    }
    navigate("/earn", { replace: true });
  };

  const handleReopenPopup = () => {
    if (!popupRef.current || popupRef.current.closed) {
      openPopup();
    } else {
      popupRef.current.focus();
    }
  };

  if (!campaign || !verificationToken) {
    return null;
  }

  return (
    <div className="min-h-screen bg-slate-50 py-8">
      <div className="max-w-4xl mx-auto px-4 space-y-6">
        {/* Header */}
        <Card>
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-2xl font-bold text-slate-800">Visit in Progress</h1>
              <p className="text-sm text-slate-600 mt-1">
                Campaign: <span className="font-semibold text-teal-700">{campaign.title}</span>
              </p>
            </div>
            <Button onClick={handleCancel} className="bg-slate-500 hover:bg-slate-600">
              Cancel Visit
            </Button>
          </div>
        </Card>

        {/* Progress Card */}
        <Card>
          <div className="space-y-4">
            {/* Timer and Progress */}
            <div className="flex items-center justify-between">
              <div>
                <div className="text-4xl font-bold text-teal-700">
                  {activeTime}s
                </div>
                <div className="text-sm text-slate-600 mt-1">
                  Active time / {requiredDuration}s required
                </div>
              </div>
              <div className="text-right">
                <div className="text-2xl font-bold text-slate-800">
                  {formatCoins(coinsToEarn)}
                </div>
                <div className="text-sm text-slate-600">
                  {isComplete ? "Ready to claim" : "In progress"}
                </div>
              </div>
            </div>

            {/* Progress Bar */}
            <div className="w-full h-3 bg-slate-200 rounded-full overflow-hidden">
              <div
                className="h-full bg-gradient-to-r from-teal-600 to-sky-600 transition-all duration-300"
                style={{ width: `${Math.min(progress, 100)}%` }}
              />
            </div>

            {/* Status Message */}
            <div className="text-center">
              {isPaused && popupClosed && !isComplete && (
                <p className="text-red-700 font-medium">⚠️ Popup closed - Please reopen to continue</p>
              )}
              {isPaused && !popupClosed && popupOpen && !isComplete && (
                <p className="text-amber-700 font-medium">⏸ Paused - Switch to the popup window to start counting</p>
              )}
              {!isPaused && !isComplete && popupOpen && (
                <p className="text-teal-700 font-medium">
                  ✅ Counting! Stay on the popup for {requiredDuration - activeTime}s more to earn {formatCoins(coinsToEarn)}
                </p>
              )}
              {isComplete && (
                <p className="text-green-700 font-medium text-lg">🎉 Complete! Switch back here to claim your reward</p>
              )}
            </div>
          </div>
        </Card>

        {/* Activity Tracking Card */}
        {/* <Card>
          <h3 className="text-lg font-semibold mb-3">Activity Tracking</h3>
          <div className="grid grid-cols-3 gap-4">
            <div className="text-center p-3 bg-slate-50 rounded-lg">
              <div className="text-2xl font-bold text-teal-700">{mouseMovements}</div>
              <div className="text-xs text-slate-600 mt-1">Mouse Movements</div>
            </div>
            <div className="text-center p-3 bg-slate-50 rounded-lg">
              <div className="text-2xl font-bold text-teal-700">
                {popupOpen && !popupClosed ? "✓" : "✗"}
              </div>
              <div className="text-xs text-slate-600 mt-1">Popup Open</div>
            </div>
            <div className="text-center p-3 bg-slate-50 rounded-lg">
              <div className="text-2xl font-bold text-teal-700">
                {verificationPassed ? "✓" : "✗"}
              </div>
              <div className="text-xs text-slate-600 mt-1">Human Verified</div>
            </div>
          </div>

          {rewardTier === "passive" && !isComplete && (
            <div className="mt-4 bg-amber-50 border border-amber-200 rounded-lg px-4 py-3">
              <p className="text-sm text-amber-800">
                💡 <strong>Tip:</strong> Complete the human verification challenge when it appears to get{" "}
                <strong>100% reward</strong> instead of 50%! Only {ACTIVE_TIME_THRESHOLD - activeTime}s more needed.
              </p>
            </div>
          )}
        </Card> */}

        {/* Popup Control Card */}
        {!isComplete && (
          <Card>
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-lg font-semibold">Campaign Popup</h3>
                <p className="text-sm text-slate-600 mt-1">
                  {popupOpen && !popupClosed ? (
                    <span className="text-green-600">✓ Popup is open and being tracked</span>
                  ) : (
                    <span className="text-red-600">✗ Popup is closed</span>
                  )}
                </p>
              </div>
              <Button onClick={handleReopenPopup} className="bg-blue-600 hover:bg-blue-700">
                {popupOpen && !popupClosed ? "Focus Popup" : "Reopen Popup"}
              </Button>
            </div>
          </Card>
        )}

        {/* Error Display */}
        {error && (
          <Card>
            <div className="bg-red-50 border border-red-200 rounded-lg px-4 py-3">
              <p className="text-sm text-red-700">{error}</p>
            </div>
          </Card>
        )}

        {/* Claim Button */}
        <Card>
          <Button
            onClick={handleClaim}
            disabled={!canClaim || isClaiming}
            className="w-full text-lg py-4"
          >
            {isClaiming
              ? "Claiming..."
              : canClaim
                ? `Claim Reward (${formatCoinsValue(coinsToEarn)} coins)`
                : `Wait ${requiredDuration - activeTime}s to unlock reward`}
          </Button>
        </Card>
      </div>
    </div>
  );
}

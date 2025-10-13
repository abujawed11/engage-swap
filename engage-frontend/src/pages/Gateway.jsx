// src/pages/Gateway.jsx - Enhanced version with popup window tracking
import { useEffect, useState, useRef } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import Card from "../components/ui/Card";
import Button from "../components/ui/Button";
import { earn as earnAPI } from "../lib/api";
import { useApp } from "../lib/appState";

const VERIFICATION_DURATION = 30; // 30 seconds for full verification
const HEARTBEAT_INTERVAL = 5000; // Send metrics every 5 seconds
const MOUSE_ACTIVITY_THRESHOLD = 10; // Minimum mouse movements for active engagement
const PASSIVE_TIME_THRESHOLD = 20; // 20s for passive reward (50% coins)
const ACTIVE_TIME_THRESHOLD = 30; // 30s + activity for full reward (100% coins)

export default function Gateway() {
  const location = useLocation();
  const navigate = useNavigate();
  const { user, setUser } = useApp();

  const { campaign, verificationToken } = location.state || {};

  // Time tracking
  const [activeTime, setActiveTime] = useState(0);
  const [isPaused, setIsPaused] = useState(true); // Start paused (user is on our page, not popup)
  const [isComplete, setIsComplete] = useState(false);
  const [rewardTier, setRewardTier] = useState(null); // 'passive' or 'active'

  // Activity tracking
  const [mouseMovements, setMouseMovements] = useState(0);
  const [lastMousePos, setLastMousePos] = useState({ x: 0, y: 0 });
  const [showVerification, setShowVerification] = useState(false);
  const [verificationDot, setVerificationDot] = useState({ x: 0, y: 0 });
  const [verificationPassed, setVerificationPassed] = useState(false);

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

  // Open popup automatically on mount
  useEffect(() => {
    if (campaign && !popupRef.current) {
      openPopup();
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

        // Check for passive tier completion (20s)
        if (newTime >= PASSIVE_TIME_THRESHOLD && !rewardTier) {
          setRewardTier("passive");
        }

        // Check for active tier completion (30s + either mouse activity OR verification passed)
        // Since user is on popup, they won't move mouse on our page much
        if (newTime >= ACTIVE_TIME_THRESHOLD && (mouseMovements >= MOUSE_ACTIVITY_THRESHOLD || verificationPassed)) {
          setRewardTier("active");
          setIsComplete(true);
        }

        // Also check if passive tier can be upgraded to active
        if (newTime >= ACTIVE_TIME_THRESHOLD && rewardTier === "passive" && verificationPassed) {
          setRewardTier("active");
          setIsComplete(true);
        }

        // Show verification challenge at 15s if low mouse activity
        if (newTime === 15 && mouseMovements < MOUSE_ACTIVITY_THRESHOLD / 2 && !verificationPassed) {
          triggerVerification();
        }

        return newTime;
      });
    }, 1000);

    return () => {
      if (intervalRef.current) clearInterval(intervalRef.current);
    };
  }, [isPaused, isComplete, mouseMovements, rewardTier, verificationPassed, popupOpen]);

  // Heartbeat: send metrics to backend every 5 seconds
  useEffect(() => {
    if (!verificationToken || isComplete) return;

    heartbeatRef.current = setInterval(async () => {
      try {
        await earnAPI.sendHeartbeat({
          token: verificationToken,
          activeTime,
          mouseMovements,
          verificationPassed,
        });
      } catch (err) {
        console.error("Heartbeat failed:", err);
      }
    }, HEARTBEAT_INTERVAL);

    return () => {
      if (heartbeatRef.current) clearInterval(heartbeatRef.current);
    };
  }, [verificationToken, activeTime, mouseMovements, verificationPassed, isComplete]);

  // Trigger human verification challenge
  const triggerVerification = () => {
    const x = Math.random() * 60 + 20;
    const y = Math.random() * 60 + 20;
    setVerificationDot({ x, y });
    setShowVerification(true);

    setTimeout(() => {
      if (!verificationPassed) {
        setShowVerification(false);
      }
    }, 10000);
  };

  const handleVerificationClick = () => {
    setVerificationPassed(true);
    setShowVerification(false);
  };

  const progress = (activeTime / ACTIVE_TIME_THRESHOLD) * 100;
  const canClaim = rewardTier !== null;

  const handleClaim = async () => {
    if (!canClaim || isClaiming) return;

    setIsClaiming(true);
    setError("");

    try {
      const data = await earnAPI.claimReward(verificationToken, {
        activeTime,
        mouseMovements,
        verificationPassed,
        rewardTier,
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
                  Active time / {ACTIVE_TIME_THRESHOLD}s required
                </div>
              </div>
              <div className="text-right">
                <div className="text-2xl font-bold text-slate-800">
                  {rewardTier === "passive"
                    ? `${(campaign.coins_per_visit * 0.5).toFixed(1)}`
                    : campaign.coins_per_visit}
                  {" "}coins
                </div>
                <div className="text-sm text-slate-600">
                  {rewardTier === "passive" ? "Passive (50%)" : rewardTier === "active" ? "Active (100%)" : "Pending"}
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
              {isPaused && popupClosed && (
                <p className="text-red-700 font-medium">⚠️ Popup closed - Please reopen to continue</p>
              )}
              {isPaused && !popupClosed && popupOpen && (
                <p className="text-amber-700 font-medium">⏸ Paused - Switch to the popup window to start counting</p>
              )}
              {!isPaused && !isComplete && popupOpen && (
                <p className="text-teal-700 font-medium">
                  ✅ Counting! Stay on the popup for {ACTIVE_TIME_THRESHOLD - activeTime}s more for full reward
                </p>
              )}
              {isComplete && (
                <p className="text-green-700 font-medium text-lg">🎉 Complete! Switch back here to claim your reward</p>
              )}
            </div>
          </div>
        </Card>

        {/* Activity Tracking Card */}
        <Card>
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
        </Card>

        {/* Popup Control Card */}
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
                ? `Claim ${rewardTier === "passive" ? "50%" : "100%"} Reward (${
                    rewardTier === "passive"
                      ? (campaign.coins_per_visit * 0.5).toFixed(1)
                      : campaign.coins_per_visit
                  } coins)`
                : `Wait ${PASSIVE_TIME_THRESHOLD - activeTime}s to unlock reward`}
          </Button>
        </Card>

        {/* Verification Challenge Overlay */}
        {showVerification && (
          <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50">
            <Card className="max-w-md mx-4">
              <h3 className="text-xl font-bold mb-3">🤖 Human Verification</h3>
              <p className="text-sm text-slate-600 mb-4">
                Click the green dot to prove you're actively viewing this page (not a bot!)
              </p>
              <div className="relative w-full h-64 bg-slate-100 rounded-lg border-2 border-slate-300">
                <button
                  onClick={handleVerificationClick}
                  className="absolute w-12 h-12 bg-green-500 rounded-full hover:bg-green-600 transition-transform hover:scale-110 shadow-lg"
                  style={{
                    left: `${verificationDot.x}%`,
                    top: `${verificationDot.y}%`,
                    transform: "translate(-50%, -50%)",
                  }}
                  aria-label="Click to verify"
                />
              </div>
              <p className="text-xs text-slate-500 mt-3 text-center">
                Challenge will auto-hide in 10 seconds if not completed
              </p>
            </Card>
          </div>
        )}
      </div>
    </div>
  );
}

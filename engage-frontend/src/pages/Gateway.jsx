// src/pages/Gateway.jsx
import { useEffect, useState, useRef } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import Card from "../components/ui/Card";
import Button from "../components/ui/Button";
import { earn as earnAPI } from "../lib/api";
import { useApp } from "../lib/appState";

const VERIFICATION_DURATION = 15; // seconds

export default function Gateway() {
  const location = useLocation();
  const navigate = useNavigate();
  const { user, setUser } = useApp();

  // Extract params from location state
  const { campaign, verificationToken } = location.state || {};

  const [secondsLeft, setSecondsLeft] = useState(VERIFICATION_DURATION);
  const [isPaused, setIsPaused] = useState(false);
  const [isClaiming, setIsClaiming] = useState(false);
  const [error, setError] = useState("");
  const intervalRef = useRef(null);

  // Redirect to earn page if no token
  useEffect(() => {
    if (!campaign || !verificationToken) {
      navigate("/earn", { replace: true });
    }
  }, [campaign, verificationToken, navigate]);

  // Page Visibility API: pause timer when tab is hidden
  useEffect(() => {
    const handleVisibilityChange = () => {
      if (document.hidden) {
        setIsPaused(true);
      } else {
        setIsPaused(false);
      }
    };

    document.addEventListener("visibilitychange", handleVisibilityChange);
    return () => {
      document.removeEventListener("visibilitychange", handleVisibilityChange);
    };
  }, []);

  // Countdown timer
  useEffect(() => {
    if (isPaused || secondsLeft <= 0) {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
        intervalRef.current = null;
      }
      return;
    }

    intervalRef.current = setInterval(() => {
      setSecondsLeft((prev) => {
        if (prev <= 1) {
          clearInterval(intervalRef.current);
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    return () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
      }
    };
  }, [isPaused, secondsLeft]);

  const progress = ((VERIFICATION_DURATION - secondsLeft) / VERIFICATION_DURATION) * 100;
  const isComplete = secondsLeft === 0;

  const handleContinue = async () => {
    if (!isComplete || isClaiming) return;

    setIsClaiming(true);
    setError("");

    try {
      // Claim reward with verification token
      const data = await earnAPI.claimReward(verificationToken);

      // Update user's coin balance
      if (user) {
        setUser({ ...user, coins: data.new_balance });
      }

      // Show toast notification via state
      navigate("/earn", {
        replace: true,
        state: {
          showToast: true,
          earnedCoins: data.coins_earned,
        },
      });

      // Open destination URL
      window.open(campaign.url, "_blank", "noopener,noreferrer");
    } catch (err) {
      setError(err.message || "Failed to verify visit");
      setIsClaiming(false);
    }
  };

  const handleCancel = () => {
    navigate("/earn", { replace: true });
  };

  if (!campaign || !verificationToken) {
    return null;
  }

  return (
    <div className="min-h-[60vh] flex items-center justify-center">
      <Card className="max-w-lg w-full">
        <div className="space-y-6">
          <div className="text-center">
            <h2 className="text-2xl font-bold text-slate-800">Get Ready to Visit</h2>
            <p className="text-slate-600 mt-2">
              Campaign: <span className="font-semibold text-teal-700">{campaign.title}</span>
            </p>
          </div>

          {error && (
            <div className="bg-red-50 border border-red-200 rounded-lg px-4 py-3">
              <p className="text-sm text-red-700">{error}</p>
            </div>
          )}

          <div className="bg-gradient-to-br from-teal-50 to-sky-50 border border-teal-200 rounded-lg p-6 text-center space-y-4">
            <div className="text-6xl font-bold text-teal-700">
              {secondsLeft}
            </div>
            <p className="text-sm text-slate-700 font-medium">
              {isPaused && "Timer paused (tab hidden)"}
              {!isPaused && !isComplete && "Stay on this page to verify your visit"}
              {isComplete && "Verification complete! Click below to continue"}
            </p>
          </div>

          {/* Progress bar */}
          <div className="w-full bg-slate-200 rounded-full h-3 overflow-hidden">
            <div
              className="bg-gradient-to-r from-teal-600 to-sky-600 h-full transition-all duration-300 ease-out"
              style={{ width: `${progress}%` }}
            />
          </div>

          <div className="bg-amber-50 border border-amber-200 rounded-lg px-4 py-3">
            <p className="text-sm text-slate-700">
              <span className="font-semibold">Reward:</span> +{campaign.coins_per_visit} coins
            </p>
            <p className="text-xs text-slate-600 mt-1">
              The timer will pause automatically if you switch tabs. Stay here until the countdown completes.
            </p>
          </div>

          <div className="flex gap-3">
            <Button
              onClick={handleCancel}
              disabled={isClaiming}
              className="flex-1 bg-slate-500 hover:bg-slate-600 disabled:bg-slate-300"
            >
              Cancel
            </Button>
            <Button
              onClick={handleContinue}
              disabled={!isComplete || isClaiming}
              className="flex-1"
            >
              {isClaiming ? "Processing..." : isComplete ? "Continue to Site" : `Wait ${secondsLeft}s`}
            </Button>
          </div>
        </div>
      </Card>
    </div>
  );
}

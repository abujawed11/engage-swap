import { useEffect, useState, useRef } from "react";
import Card from "./ui/Card";
import Button from "./ui/Button";

const VERIFICATION_DURATION = 15; // seconds

export default function VisitModal({ campaign, onClaim, onClose }) {
  const [secondsLeft, setSecondsLeft] = useState(VERIFICATION_DURATION);
  const [isPaused, setIsPaused] = useState(false);
  const intervalRef = useRef(null);

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

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <Card className="max-w-md w-full">
        <div className="space-y-4">
          <div>
            <h3 className="text-xl font-semibold">Visit Verification</h3>
            <p className="text-sm text-slate-600 mt-1">
              Campaign: <span className="font-medium">{campaign.title}</span>
            </p>
          </div>

          <div className="bg-teal-50 border border-teal-200 rounded p-3 text-sm text-slate-700">
            <p className="font-medium mb-1">Page opened in new tab</p>
            <p className="text-xs text-slate-600">
              Stay on this app to complete verification. Timer pauses when you switch tabs.
            </p>
          </div>

          <div className="text-center space-y-2">
            <div className="text-4xl font-bold text-teal-700">
              {secondsLeft}s
            </div>
            {isPaused && (
              <p className="text-sm text-amber-600 font-medium">
                Timer paused (tab hidden)
              </p>
            )}
            {!isPaused && !isComplete && (
              <p className="text-sm text-slate-500">
                Time remaining...
              </p>
            )}
            {isComplete && (
              <p className="text-sm text-teal-600 font-medium">
                Verification complete!
              </p>
            )}
          </div>

          {/* Progress bar */}
          <div className="w-full bg-slate-200 rounded-full h-2 overflow-hidden">
            <div
              className="bg-teal-600 h-full transition-all duration-300"
              style={{ width: `${progress}%` }}
            />
          </div>

          <div className="flex gap-2 pt-2">
            <Button
              onClick={onClose}
              className="flex-1 bg-slate-500 hover:bg-slate-600"
            >
              Cancel
            </Button>
            <Button
              onClick={onClaim}
              disabled={!isComplete}
              className="flex-1"
            >
              {isComplete ? "Claim Reward" : "Counting..."}
            </Button>
          </div>
        </div>
      </Card>
    </div>
  );
}

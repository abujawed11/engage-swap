// src/pages/Earn.jsx
import { useState, useEffect } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import Card from "../components/ui/Card";
import Button from "../components/ui/Button";
import { earn as earnAPI } from "../lib/api";
import { useApp } from "../lib/appState";
import { formatCoinsValue } from "../lib/coins";

const COOLDOWN_MS = 5000; // 5 seconds

export default function Earn() {
  const { user } = useApp();
  const navigate = useNavigate();
  const location = useLocation();
  const [campaigns, setCampaigns] = useState([]);
  const [cooldownUntil, setCooldownUntil] = useState(0);
  const [showToast, setShowToast] = useState(false);
  const [earnedCoins, setEarnedCoins] = useState(0);
  const [error, setError] = useState("");

  // Check if returning from gateway with toast
  useEffect(() => {
    if (location.state?.showToast) {
      setEarnedCoins(location.state.earnedCoins);
      setShowToast(true);
      setTimeout(() => setShowToast(false), 3000);

      // Set cooldown
      setCooldownUntil(Date.now() + COOLDOWN_MS);

      // Clear navigation state
      window.history.replaceState({}, document.title);
    }
  }, [location]);

  // Fetch earn queue on mount
  useEffect(() => {
    fetchQueue();
  }, []);

  const fetchQueue = async () => {
    try {
      const data = await earnAPI.getQueue();
      setCampaigns(data.campaigns || []);
    } catch (err) {
      console.error("Failed to fetch earn queue:", err);
    }
  };

  const handleVisit = async (campaign) => {
    setError("");

    try {
      // Request verification token from server
      const data = await earnAPI.startVisit(campaign.id);

      // Navigate to gateway page with campaign and token
      navigate("/gateway", {
        state: {
          campaign,
          verificationToken: data.token,
        },
      });
    } catch (err) {
      setError(err.message);
      // Refresh queue in case campaign is no longer available
      fetchQueue();
    }
  };

  const isInCooldown = Date.now() < cooldownUntil;

  return (
    <div className="space-y-6">
      <Card>
        <h2 className="text-2xl font-semibold">Earn Coins</h2>
        <p className="mt-2 text-slate-600">
          Visit campaigns and watch for the required duration to earn coins. Choose from available campaigns below.
        </p>
      </Card>

      {error && (
        <Card>
          <p className="text-sm text-red-600 bg-red-50 border border-red-200 rounded px-3 py-2">
            {error}
          </p>
        </Card>
      )}

      {campaigns.length === 0 ? (
        <Card>
          <p className="text-slate-600">
            No eligible campaigns right now. Create one on the Promote page, or check back later.
          </p>
        </Card>
      ) : (
        <div className="space-y-4">
          <Card>
            <h3 className="text-lg font-semibold text-slate-700">
              Available Campaigns ({campaigns.length})
            </h3>
          </Card>

          {campaigns.map((campaign) => (
            <Card key={campaign.id}>
              <div className="flex items-start justify-between gap-4">
                <div className="flex-1">
                  <div className="text-lg font-semibold">{campaign.title}</div>
                  <a
                    href={campaign.url}
                    target="_blank"
                    rel="noreferrer"
                    className="text-sm text-teal-700 break-all hover:underline"
                  >
                    {campaign.url}
                  </a>
                  <div className="mt-2 flex items-center gap-4 text-sm text-slate-600">
                    <span className="font-semibold text-teal-700">
                      +{formatCoinsValue(campaign.coins_per_visit)} coins
                    </span>
                    <span>•</span>
                    <span>{campaign.watch_duration || 30}s watch required</span>
                    <span>•</span>
                    <span>{campaign.clicks_served}/{campaign.total_clicks} completed</span>
                  </div>
                  {/* Progress bar */}
                  <div className="mt-2 w-full bg-slate-200 rounded-full h-2">
                    <div
                      className="bg-teal-600 h-2 rounded-full transition-all"
                      style={{ width: `${(campaign.clicks_served / campaign.total_clicks) * 100}%` }}
                    />
                  </div>
                </div>

                <div className="shrink-0">
                  <Button
                    onClick={() => handleVisit(campaign)}
                    disabled={isInCooldown}
                    className="whitespace-nowrap"
                  >
                    {isInCooldown ? "Cooldown..." : "Visit & Earn"}
                  </Button>
                </div>
              </div>
            </Card>
          ))}
        </div>
      )}

      {/* Toast Notification */}
      {showToast && (
        <div className="fixed bottom-6 right-6 bg-teal-600 text-white px-4 py-3 rounded-lg shadow-lg flex items-center gap-2 z-50">
          <span className="text-xl">🎉</span>
          <span className="font-medium">+{earnedCoins} coins earned!</span>
        </div>
      )}
    </div>
  );
}

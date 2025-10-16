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
  const [isInCooldown, setIsInCooldown] = useState(false);
  const [showToast, setShowToast] = useState(false);
  const [earnedCoins, setEarnedCoins] = useState(0);
  const [isConsolation, setIsConsolation] = useState(false);
  const [consolationMessage, setConsolationMessage] = useState('');
  const [consolationDescription, setConsolationDescription] = useState('');
  const [error, setError] = useState("");
  const [isRefreshing, setIsRefreshing] = useState(false);

  // Check if returning from gateway with toast
  useEffect(() => {
    if (location.state?.showToast) {
      setEarnedCoins(location.state.earnedCoins);
      setIsConsolation(location.state.isConsolation || false);
      setConsolationMessage(location.state.consolationMessage || '');
      setConsolationDescription(location.state.consolationDescription || '');
      setShowToast(true);
      setTimeout(() => setShowToast(false), 8000); // 8s for consolation messages

      // Set cooldown
      setCooldownUntil(Date.now() + COOLDOWN_MS);
      setIsInCooldown(true);

      // Clear navigation state
      window.history.replaceState({}, document.title);
    }
  }, [location]);

  // Cooldown timer - checks every 100ms and updates state when cooldown expires
  useEffect(() => {
    if (cooldownUntil === 0) return;

    const checkCooldown = () => {
      if (Date.now() >= cooldownUntil) {
        setIsInCooldown(false);
        setCooldownUntil(0);
      }
    };

    // Check immediately
    checkCooldown();

    // Then check every 100ms
    const interval = setInterval(checkCooldown, 100);

    return () => clearInterval(interval);
  }, [cooldownUntil]);

  // Fetch earn queue on mount
  useEffect(() => {
    fetchQueue();
  }, []);

  const fetchQueue = async () => {
    try {
      const data = await earnAPI.getQueue();
      setCampaigns(data.campaigns || []);
      setError(""); // Clear any previous errors on successful fetch
    } catch (err) {
      console.error("Failed to fetch earn queue:", err);
      setError("Failed to load campaigns. Please try again.");
    }
  };

  const handleRefresh = async () => {
    setIsRefreshing(true);
    await fetchQueue();
    setTimeout(() => setIsRefreshing(false), 500); // Brief delay for visual feedback
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
            <div className="flex items-center justify-between">
              <h3 className="text-lg font-semibold text-slate-700">
                Available Campaigns ({campaigns.length})
              </h3>
              <Button
                onClick={handleRefresh}
                disabled={isRefreshing}
                className="text-sm"
              >
                {isRefreshing ? "Refreshing..." : "🔄 Refresh"}
              </Button>
            </div>
          </Card>

          {campaigns.map((campaign) => (
            <Card key={campaign.id}>
              <div className="flex items-start justify-between gap-4">
                <div className="flex-1">
                  <div className="flex items-center gap-2">
                    <div className="text-lg font-semibold">{campaign.title}</div>
                    {campaign.creator_username && (
                      <span className="text-xs text-slate-500 bg-slate-100 px-2 py-0.5 rounded">
                        by @{campaign.creator_username}
                      </span>
                    )}
                  </div>
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

                  {/* Availability Status Message */}
                  {!campaign.available && campaign.status_message && (
                    <div className={`mt-3 px-3 py-2 rounded border ${
                      campaign.availability_status === 'LIMIT_REACHED'
                        ? 'bg-red-50 border-red-200'
                        : 'bg-yellow-50 border-yellow-200'
                    }`}>
                      <p className={`text-sm font-medium ${
                        campaign.availability_status === 'LIMIT_REACHED'
                          ? 'text-red-800'
                          : 'text-yellow-800'
                      }`}>
                        {campaign.status_message}
                      </p>
                      {campaign.retry_info && (
                        <p className={`text-xs mt-1 ${
                          campaign.availability_status === 'LIMIT_REACHED'
                            ? 'text-red-600'
                            : 'text-yellow-600'
                        }`}>
                          {campaign.retry_info}
                        </p>
                      )}
                    </div>
                  )}
                </div>

                <div className="shrink-0">
                  <Button
                    onClick={() => handleVisit(campaign)}
                    disabled={isInCooldown || !campaign.available}
                    className="whitespace-nowrap"
                  >
                    {!campaign.available
                      ? "Not Available"
                      : isInCooldown
                        ? "Cooldown..."
                        : "Visit & Earn"
                    }
                  </Button>
                </div>
              </div>
            </Card>
          ))}
        </div>
      )}

      {/* Toast Notification */}
      {showToast && !isConsolation && (
        <div className="fixed bottom-6 right-6 bg-teal-600 text-white px-4 py-3 rounded-lg shadow-lg flex items-center gap-2 z-50 animate-slide-up">
          <span className="text-xl">🎉</span>
          <span className="font-medium">+{earnedCoins} coins earned!</span>
        </div>
      )}

      {/* Consolation Toast Notification */}
      {showToast && isConsolation && (
        <div className="fixed bottom-6 right-6 bg-blue-600 text-white px-6 py-4 rounded-lg shadow-xl max-w-sm z-50 animate-slide-up">
          <div className="flex items-start gap-3">
            <span className="text-2xl">💙</span>
            <div>
              <div className="font-bold text-lg mb-1">{consolationMessage}</div>
              <p className="text-sm opacity-90 mb-2">{consolationDescription}</p>
              <div className="flex items-center gap-2 text-sm font-medium">
                <span>+{earnedCoins} coins</span>
                <span className="bg-white bg-opacity-20 px-2 py-0.5 rounded">Goodwill Reward</span>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

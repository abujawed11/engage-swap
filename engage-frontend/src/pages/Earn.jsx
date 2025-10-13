// src/pages/Earn.jsx
import { useState, useEffect } from "react";
import Card from "../components/ui/Card";
import Button from "../components/ui/Button";
import VisitModal from "../components/VisitModal";
import { earn as earnAPI } from "../lib/api";
import { useApp } from "../lib/appState";

const COOLDOWN_MS = 5000; // 5 seconds

export default function Earn() {
  const { user, setUser } = useApp();
  const [campaigns, setCampaigns] = useState([]);
  const [activeCampaign, setActiveCampaign] = useState(null);
  const [verificationToken, setVerificationToken] = useState(null);
  const [cooldownUntil, setCooldownUntil] = useState(0);
  const [showToast, setShowToast] = useState(false);
  const [earnedCoins, setEarnedCoins] = useState(0);
  const [error, setError] = useState("");

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

  // Get the first campaign (for now, just show one at a time)
  const nextCampaign = campaigns.length > 0 ? campaigns[0] : null;

  const handleVisit = async (campaign) => {
    setError("");

    try {
      // Request verification token from server
      const data = await earnAPI.startVisit(campaign.id);

      // Open campaign URL in new tab
      window.open(campaign.url, "_blank", "noreferrer");

      // Store token and show verification modal
      setVerificationToken(data.token);
      setActiveCampaign(campaign);
    } catch (err) {
      setError(err.message);
      // Refresh queue in case campaign is no longer available
      fetchQueue();
    }
  };

  const handleClaim = async () => {
    if (!activeCampaign || !verificationToken) return;

    setError("");

    try {
      // Claim reward with verification token
      const data = await earnAPI.claimReward(verificationToken);

      // Update user's coin balance
      if (user) {
        setUser({ ...user, coins: data.new_balance });
      }

      // Show toast notification
      setEarnedCoins(data.coins_earned);
      setShowToast(true);
      setTimeout(() => setShowToast(false), 3000);

      // Set cooldown
      setCooldownUntil(Date.now() + COOLDOWN_MS);

      // Close modal
      setActiveCampaign(null);
      setVerificationToken(null);

      // Refresh queue
      fetchQueue();
    } catch (err) {
      setError(err.message);
      // Close modal on error
      setActiveCampaign(null);
      setVerificationToken(null);
      // Refresh queue
      fetchQueue();
    }
  };

  const handleCancel = () => {
    setActiveCampaign(null);
    setVerificationToken(null);
  };

  const isInCooldown = Date.now() < cooldownUntil;
  const isVerifying = activeCampaign !== null;

  return (
    <div className="space-y-6">
      <Card>
        <h2 className="text-2xl font-semibold">Earn</h2>
        <p className="mt-2 text-slate-600">
          Visit a campaign and stay on this app for 15 seconds to earn coins.
          Timer pauses if you switch tabs.
        </p>
      </Card>

      {error && (
        <Card>
          <p className="text-sm text-red-600 bg-red-50 border border-red-200 rounded px-3 py-2">
            {error}
          </p>
        </Card>
      )}

      {!nextCampaign ? (
        <Card>
          <p className="text-slate-600">
            No eligible campaigns right now. Create one on the Promote page, or check back later.
          </p>
        </Card>
      ) : (
        <Card>
          <div className="flex items-start justify-between gap-4">
            <div>
              <div className="text-lg font-semibold">{nextCampaign.title}</div>
              <a
                href={nextCampaign.url}
                target="_blank"
                rel="noreferrer"
                className="text-teal-700 break-all"
              >
                {nextCampaign.url}
              </a>
              <div className="mt-1 text-sm text-slate-500">
                +{nextCampaign.coins_per_visit} coins • Daily cap {nextCampaign.daily_cap}
              </div>
            </div>

            <div className="shrink-0">
              <Button
                onClick={() => handleVisit(nextCampaign)}
                disabled={isVerifying || isInCooldown}
              >
                {isInCooldown ? "Cooldown..." : "Visit & Verify"}
              </Button>
            </div>
          </div>
        </Card>
      )}

      {/* Verification Modal */}
      {activeCampaign && (
        <VisitModal
          campaign={activeCampaign}
          onClaim={handleClaim}
          onClose={handleCancel}
        />
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

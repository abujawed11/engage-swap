// src/pages/Earn.jsx
import { useMemo, useState } from "react";
import { useApp } from "../lib/appState";
import Card from "../components/ui/Card";
import Button from "../components/ui/Button";
import VisitModal from "../components/VisitModal";

const COOLDOWN_MS = 5000; // 5 seconds

export default function Earn() {
  const { campaigns, creditVisit } = useApp();
  const [activeCampaign, setActiveCampaign] = useState(null);
  const [cooldownUntil, setCooldownUntil] = useState(0);
  const [showToast, setShowToast] = useState(false);
  const [earnedCoins, setEarnedCoins] = useState(0);

  // Fair rotation: pick the eligible campaign with the oldest lastServedAt
  const nextCampaign = useMemo(() => {
    const today = new Date().toISOString().slice(0, 10);

    // Filter eligible campaigns: not paused and not at daily cap
    const eligible = campaigns.filter((c) => {
      if (c.isPaused) return false;
      const servedToday = c.servedDay === today ? c.servedToday : 0;
      return servedToday < c.dailyCap;
    });

    if (eligible.length === 0) return null;

    // Pick the one with oldest lastServedAt (undefined = never served = oldest)
    return eligible.reduce((oldest, current) => {
      // undefined is treated as oldest (0)
      const oldestTime = oldest.lastServedAt ?? 0;
      const currentTime = current.lastServedAt ?? 0;
      return currentTime < oldestTime ? current : oldest;
    });
  }, [campaigns]);

  const handleVisit = (campaign) => {
    // Open campaign URL in new tab
    window.open(campaign.url, "_blank", "noreferrer");

    // Show verification modal
    setActiveCampaign(campaign);
  };

  const handleClaim = () => {
    if (!activeCampaign) return;

    // Credit the visit
    creditVisit(activeCampaign.id);

    // Show toast notification
    setEarnedCoins(activeCampaign.coinsPerVisit);
    setShowToast(true);
    setTimeout(() => setShowToast(false), 3000);

    // Set cooldown
    setCooldownUntil(Date.now() + COOLDOWN_MS);

    // Close modal
    setActiveCampaign(null);
  };

  const handleCancel = () => {
    setActiveCampaign(null);
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
                +{nextCampaign.coinsPerVisit} coins • Daily cap{" "}
                {nextCampaign.servedToday ?? 0}/{nextCampaign.dailyCap}
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

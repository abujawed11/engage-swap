// src/pages/Earn.jsx
import { useMemo, useState } from "react";
import { useApp } from "../lib/appState";
import Card from "../components/ui/Card";
import Button from "../components/ui/Button";

export default function Earn() {
  const { campaigns, creditVisit } = useApp();
  const [loadingId, setLoadingId] = useState(null);

  // pick the first campaign that still has remaining daily cap
  const nextCampaign = useMemo(() => {
    const today = new Date().toISOString().slice(0, 10);
    return campaigns.find((c) => {
      const servedToday = c.servedDay === today ? c.servedToday : 0;
      return servedToday < c.dailyCap;
    });
  }, [campaigns]);

  const handleVisit = async (id) => {
    setLoadingId(id);
    // simulate a “stay 3s on site” timer (placeholder for real verification)
    await new Promise((r) => setTimeout(r, 3000));
    creditVisit(id);
    setLoadingId(null);
  };

  return (
    <div className="space-y-6">
      <Card>
        <h2 className="text-2xl font-semibold">Earn</h2>
        <p className="mt-2 text-slate-600">
          Visit a campaign and earn coins after a brief verification timer.
          (Local simulation for now — we’ll replace this with real verification.)
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
                onClick={() => handleVisit(nextCampaign.id)}
                disabled={loadingId === nextCampaign.id}
              >
                {loadingId === nextCampaign.id ? "Verifying..." : "Visit & Verify"}
              </Button>
            </div>
          </div>
        </Card>
      )}
    </div>
  );
}

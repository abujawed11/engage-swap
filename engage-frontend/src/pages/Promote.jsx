import { useState, useEffect } from "react";
import Card from "../components/ui/Card";
import Button from "../components/ui/Button";
import Input from "../components/ui/Input";
import Label from "../components/ui/Label";
import { campaigns as campaignsAPI } from "../lib/api";
import { useApp } from "../lib/appState";

const isValidUrl = (u) => {
  try {
    const url = new URL(u);
    return url.protocol === "http:" || url.protocol === "https:";
  } catch {
    return false;
  }
};

export default function Promote() {
  const { user, setUser } = useApp();
  const [campaigns, setCampaigns] = useState([]);
  const [form, setForm] = useState({
    title: "",
    url: "",
    coins_per_visit: 1,
    total_clicks: 20,
  });
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [showToast, setShowToast] = useState(false);
  const [toastMessage, setToastMessage] = useState("");
  const [toastType, setToastType] = useState("deduction"); // "deduction" or "refund"

  // Fetch campaigns on mount
  useEffect(() => {
    fetchCampaigns();
  }, []);

  const fetchCampaigns = async () => {
    try {
      const data = await campaignsAPI.listMine();
      setCampaigns(data.campaigns || []);
    } catch (err) {
      console.error("Failed to fetch campaigns:", err);
    }
  };

  const onChange = (e) => {
    const { name, value } = e.target;
    setForm((f) => ({ ...f, [name]: name === "title" || name === "url" ? value : Number(value) }));
  };

  const submit = async (e) => {
    e.preventDefault();
    setError("");

    // Basic validation
    if (!form.title.trim()) return setError("Title is required.");
    if (!isValidUrl(form.url)) return setError("Enter a valid URL starting with https://");
    if (form.coins_per_visit < 1) return setError("Coins per visit must be at least 1.");
    if (form.total_clicks < 1) return setError("Total clicks must be at least 1.");

    setLoading(true);

    try {
      const totalCost = form.coins_per_visit * form.total_clicks;

      await campaignsAPI.create(form);

      // Update user balance immediately
      if (user) {
        setUser({ ...user, coins: user.coins - totalCost });
      }

      // Show beautiful toast notification
      setToastMessage(`${totalCost} coins deducted`);
      setToastType("deduction");
      setShowToast(true);
      setTimeout(() => setShowToast(false), 3000);

      setForm({ title: "", url: "", coins_per_visit: 1, total_clicks: 20 });
      await fetchCampaigns();
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const handlePauseResume = async (campaign) => {
    try {
      await campaignsAPI.update(campaign.id, { is_paused: !campaign.is_paused });
      await fetchCampaigns();
    } catch (err) {
      setError(err.message);
    }
  };

  const handleDelete = async (id, title) => {
    if (!window.confirm(`Delete campaign "${title}"?`)) return;

    try {
      const result = await campaignsAPI.remove(id);

      // Update user balance with refund
      if (user && result.refunded > 0) {
        setUser({ ...user, coins: user.coins + result.refunded });

        // Show refund toast
        setToastMessage(`${result.refunded} coins refunded`);
        setToastType("refund");
        setShowToast(true);
        setTimeout(() => setShowToast(false), 3000);
      }

      await fetchCampaigns();
    } catch (err) {
      setError(err.message);
    }
  };

  return (
    <div className="grid gap-6 md:grid-cols-2">
      <Card>
        <h2 className="text-2xl font-semibold">Create Campaign</h2>
        <p className="mt-2 text-slate-600">
          Define your landing URL and how many coins you’ll spend per verified visit.
        </p>

        <form onSubmit={submit} className="mt-6 space-y-4">
          <div>
            <Label htmlFor="title">Title</Label>
            <Input id="title" name="title" value={form.title} onChange={onChange} placeholder="My Product Landing" />
          </div>

          <div>
            <Label htmlFor="url">Target URL</Label>
            <Input id="url" name="url" value={form.url} onChange={onChange} placeholder="https://example.com" />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label htmlFor="coins_per_visit">Coins per visit</Label>
              <Input
                id="coins_per_visit"
                name="coins_per_visit"
                type="number"
                min={1}
                value={form.coins_per_visit}
                onChange={onChange}
              />
            </div>
            <div>
              <Label htmlFor="total_clicks">No of clicks</Label>
              <Input
                id="total_clicks"
                name="total_clicks"
                type="number"
                min={1}
                value={form.total_clicks}
                onChange={onChange}
              />
            </div>
          </div>

          {error && <p className="text-sm text-red-600">{error}</p>}

          <div className="pt-2">
            <Button type="submit" disabled={loading}>
              {loading ? "Saving..." : "Save Campaign"}
            </Button>
          </div>
        </form>
      </Card>

      <Card>
        <h3 className="text-lg font-semibold">Your Campaigns</h3>
        {campaigns.length === 0 ? (
          <p className="mt-2 text-slate-600">No campaigns yet. Create your first one.</p>
        ) : (
          <ul className="mt-4 space-y-3">
            {campaigns.map((c) => {
              return (
                <li key={c.id} className="rounded-lg border p-3">
                  <div className="flex items-start justify-between gap-3">
                    <div className="flex-1">
                      <div className="flex items-center gap-2">
                        <div className="font-medium">{c.title}</div>
                        <span
                          className={`text-xs px-2 py-0.5 rounded ${
                            c.is_paused
                              ? "bg-slate-200 text-slate-700"
                              : "bg-teal-100 text-teal-800"
                          }`}
                        >
                          {c.is_paused ? "Paused" : "Active"}
                        </span>
                      </div>
                      <a href={c.url} target="_blank" rel="noreferrer" className="text-sm text-teal-700 break-all">
                        {c.url}
                      </a>
                      <div className="mt-1 text-xs text-slate-500">
                        {c.coins_per_visit} coins/visit • {c.clicks_served}/{c.total_clicks} clicks
                      </div>
                      {/* Progress bar */}
                      <div className="mt-2 w-full bg-slate-200 rounded-full h-2">
                        <div
                          className="bg-teal-600 h-2 rounded-full transition-all"
                          style={{ width: `${(c.clicks_served / c.total_clicks) * 100}%` }}
                        />
                      </div>
                    </div>
                    <div className="flex items-start gap-2 shrink-0">
                      <Button
                        onClick={() => handlePauseResume(c)}
                        className="text-xs px-2 py-1 h-auto"
                      >
                        {c.is_paused ? "Resume" : "Pause"}
                      </Button>
                      <Button
                        onClick={() => handleDelete(c.id, c.title)}
                        className="text-xs px-2 py-1 h-auto bg-red-600 hover:bg-red-700"
                      >
                        Delete
                      </Button>
                    </div>
                  </div>
                </li>
              );
            })}
          </ul>
        )}
      </Card>

      {/* Beautiful Toast Notification */}
      {showToast && (
        <div
          className={`fixed bottom-6 right-6 px-6 py-4 rounded-xl shadow-2xl flex items-center gap-3 z-50 animate-slide-up ${
            toastType === "deduction"
              ? "bg-gradient-to-r from-amber-500 to-orange-600 text-white"
              : "bg-gradient-to-r from-emerald-500 to-teal-600 text-white"
          }`}
        >
          <div className="text-3xl">
            {toastType === "deduction" ? "💰" : "🎉"}
          </div>
          <div>
            <div className="font-bold text-lg">{toastMessage}</div>
            <div className="text-sm opacity-90">
              {toastType === "deduction" ? "Campaign created successfully" : "Unused coins returned"}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

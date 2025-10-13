import { useState, useEffect } from "react";
import Card from "../components/ui/Card";
import Button from "../components/ui/Button";
import Input from "../components/ui/Input";
import Label from "../components/ui/Label";
import { campaigns as campaignsAPI } from "../lib/api";

const isValidUrl = (u) => {
  try {
    const url = new URL(u);
    return url.protocol === "http:" || url.protocol === "https:";
  } catch {
    return false;
  }
};

export default function Promote() {
  const [campaigns, setCampaigns] = useState([]);
  const [form, setForm] = useState({
    title: "",
    url: "",
    coins_per_visit: 10,
    daily_cap: 50,
  });
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

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
    if (!isValidUrl(form.url)) return setError("Enter a valid URL starting with http(s)://");
    if (form.coins_per_visit < 1) return setError("Coins per visit must be at least 1.");
    if (form.daily_cap < 10) return setError("Daily cap must be at least 10.");

    setLoading(true);

    try {
      await campaignsAPI.create(form);
      setForm({ title: "", url: "", coins_per_visit: 10, daily_cap: 50 });
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
      await campaignsAPI.remove(id);
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
              <Label htmlFor="daily_cap">Daily cap</Label>
              <Input
                id="daily_cap"
                name="daily_cap"
                type="number"
                min={10}
                value={form.daily_cap}
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
                        {c.coins_per_visit} coins/visit • Daily cap {c.daily_cap}
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
    </div>
  );
}

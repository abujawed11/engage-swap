import { useState } from "react";
import Card from "../components/ui/Card";
import Button from "../components/ui/Button";
import Input from "../components/ui/Input";
import Label from "../components/ui/Label";
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
  const { addCampaign, campaigns, pauseCampaign, resumeCampaign, deleteCampaign } = useApp();
  const [form, setForm] = useState({
    title: "",
    url: "",
    coinsPerVisit: 10,
    dailyCap: 50,
  });
  const [error, setError] = useState("");

  const onChange = (e) => {
    const { name, value } = e.target;
    setForm((f) => ({ ...f, [name]: name === "title" || name === "url" ? value : Number(value) }));
  };

  const submit = (e) => {
    e.preventDefault();
    // basic validation
    if (!form.title.trim()) return setError("Title is required.");
    if (!isValidUrl(form.url)) return setError("Enter a valid URL starting with http(s)://");
    if (form.coinsPerVisit < 1) return setError("Coins per visit must be at least 1.");
    if (form.dailyCap < 10) return setError("Daily cap must be at least 10.");

    addCampaign(form);
    setForm({ title: "", url: "", coinsPerVisit: 10, dailyCap: 50 });
    setError("");
  };

  const handleDelete = (id, title) => {
    if (window.confirm(`Delete campaign "${title}"?`)) {
      deleteCampaign(id);
    }
  };

  const dayKey = () => new Date().toISOString().slice(0, 10);

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
              <Label htmlFor="coinsPerVisit">Coins per visit</Label>
              <Input
                id="coinsPerVisit"
                name="coinsPerVisit"
                type="number"
                min={1}
                value={form.coinsPerVisit}
                onChange={onChange}
              />
            </div>
            <div>
              <Label htmlFor="dailyCap">Daily cap</Label>
              <Input
                id="dailyCap"
                name="dailyCap"
                type="number"
                min={10}
                value={form.dailyCap}
                onChange={onChange}
              />
            </div>
          </div>

          {error && <p className="text-sm text-red-600">{error}</p>}

          <div className="pt-2">
            <Button type="submit">Save Campaign</Button>
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
              const today = dayKey();
              const servedToday = c.servedDay === today ? c.servedToday : 0;
              return (
                <li key={c.id} className="rounded-lg border p-3">
                  <div className="flex items-start justify-between gap-3">
                    <div className="flex-1">
                      <div className="flex items-center gap-2">
                        <div className="font-medium">{c.title}</div>
                        <span
                          className={`text-xs px-2 py-0.5 rounded ${
                            c.isPaused
                              ? "bg-slate-200 text-slate-700"
                              : "bg-teal-100 text-teal-800"
                          }`}
                        >
                          {c.isPaused ? "Paused" : "Active"}
                        </span>
                      </div>
                      <a href={c.url} target="_blank" rel="noreferrer" className="text-sm text-teal-700 break-all">
                        {c.url}
                      </a>
                      <div className="mt-1 text-xs text-slate-500">
                        {c.coinsPerVisit} coins/visit • Daily cap {c.dailyCap} • Today: {servedToday}/{c.dailyCap}
                      </div>
                    </div>
                    <div className="flex items-start gap-2 shrink-0">
                      <Button
                        onClick={() => c.isPaused ? resumeCampaign(c.id) : pauseCampaign(c.id)}
                        className="text-xs px-2 py-1 h-auto"
                      >
                        {c.isPaused ? "Resume" : "Pause"}
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

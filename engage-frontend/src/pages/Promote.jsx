import { useState, useEffect, useMemo } from "react";
import Card from "../components/ui/Card";
import Button from "../components/ui/Button";
import Input from "../components/ui/Input";
import Label from "../components/ui/Label";
import QuestionAuthoring from "../components/QuestionAuthoring";
import { campaigns as campaignsAPI } from "../lib/api";
import { useApp } from "../lib/appState";
import {
  formatCoins,
  formatCoinsValue,
  calculateDurationSteps,
  calculateDurationExtraCost,
  calculateTotalCampaignCost,
  WATCH_DURATION_OPTIONS,
  DEFAULT_WATCH_DURATION,
  validateWatchDuration,
} from "../lib/coins";

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
    watch_duration: DEFAULT_WATCH_DURATION,
    total_clicks: 20,
    questions: [],
  });
  const [error, setError] = useState("");
  const [questionError, setQuestionError] = useState("");
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

  // Calculate engagement summary live as form values change
  const engagementSummary = useMemo(() => {
    const steps = calculateDurationSteps(form.watch_duration);
    const extraCost = calculateDurationExtraCost(form.watch_duration);
    const baseCost = form.coins_per_visit * form.total_clicks;
    const totalCampaignCost = calculateTotalCampaignCost(form.coins_per_visit, form.watch_duration, form.total_clicks);

    return {
      steps,
      extraCost,
      baseCost,
      totalCampaignCost,
    };
  }, [form.coins_per_visit, form.watch_duration, form.total_clicks]);

  const onChange = (e) => {
    const { name, value } = e.target;
    setForm((f) => ({ ...f, [name]: name === "title" || name === "url" ? value : Number(value) }));
  };

  const handleQuestionsChange = (questions) => {
    setForm(f => ({ ...f, questions }));
    setQuestionError("");
  };

  const validateQuestions = () => {
    if (!form.questions || form.questions.length !== 5) {
      return "Exactly 5 questions must be configured.";
    }

    for (let i = 0; i < form.questions.length; i++) {
      const q = form.questions[i];

      if (!q.question_id) {
        return `Question ${i + 1}: Please select a question from the bank.`;
      }

      if (q.input_type === "mcq" || q.input_type === "dropdown") {
        if (!q.config.options || q.config.options.length < 3) {
          return `Question ${i + 1}: Must have at least 3 options.`;
        }

        const hasCorrect = q.config.options.some(opt => opt.is_correct);
        if (!hasCorrect) {
          return `Question ${i + 1}: One option must be marked as correct.`;
        }

        const emptyOptions = q.config.options.filter(opt => !opt.text.trim());
        if (emptyOptions.length > 0) {
          return `Question ${i + 1}: All options must have text.`;
        }
      } else if (q.input_type === "free_text") {
        if (!q.config.correct_answer || !q.config.correct_answer.trim()) {
          return `Question ${i + 1}: Correct answer is required.`;
        }
      }
    }

    return null;
  };

  const submit = async (e) => {
    e.preventDefault();
    setError("");
    setQuestionError("");

    // Basic validation
    if (!form.title.trim()) return setError("Title is required.");
    if (!isValidUrl(form.url)) return setError("Enter a valid URL starting with https://");
    if (form.coins_per_visit < 1) return setError("Coins per visit must be at least 1.");

    const durationError = validateWatchDuration(form.watch_duration);
    if (durationError) return setError(durationError);

    if (form.total_clicks < 1) return setError("Total clicks must be at least 1.");

    // Validate questions
    const questionsError = validateQuestions();
    if (questionsError) {
      setQuestionError(questionsError);
      return;
    }

    setLoading(true);

    try {
      const totalCost = engagementSummary.totalCampaignCost;

      await campaignsAPI.create(form);

      // Update user balance immediately
      if (user) {
        setUser({ ...user, coins: user.coins - totalCost });
      }

      // Show beautiful toast notification
      setToastMessage(`${formatCoinsValue(totalCost)} coins deducted`);
      setToastType("deduction");
      setShowToast(true);
      setTimeout(() => setShowToast(false), 3000);

      setForm({
        title: "",
        url: "",
        coins_per_visit: 1,
        watch_duration: DEFAULT_WATCH_DURATION,
        total_clicks: 20,
        questions: []
      });
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
    <div className="space-y-6">
      {/* Create Campaign Form - Full Width */}
      <Card>
        <h2 className="text-2xl font-semibold">Create Campaign</h2>
        <p className="mt-2 text-slate-600">
          Define your landing URL and how many coins you'll spend per verified visit.
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
              <Label htmlFor="coins_per_visit">Base Coins per Visit</Label>
              <Input
                id="coins_per_visit"
                name="coins_per_visit"
                type="number"
                min={1}
                step="0.1"
                value={form.coins_per_visit}
                onChange={onChange}
              />
              <p className="text-xs text-slate-500 mt-1">Minimum reward amount</p>
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

          <div>
            <Label htmlFor="watch_duration">Required Watch Duration (seconds)</Label>
            <select
              id="watch_duration"
              name="watch_duration"
              value={form.watch_duration}
              onChange={onChange}
              className="w-full px-3 py-2 border border-slate-300 rounded-md focus:outline-none focus:ring-2 focus:ring-teal-500 bg-white"
            >
              {WATCH_DURATION_OPTIONS.map((duration) => (
                <option key={duration} value={duration}>
                  {duration}s
                </option>
              ))}
            </select>
            <p className="text-xs text-slate-500 mt-1">
              Longer watch time increases cost by +5 coins per extra 15s beyond 30s.
            </p>
          </div>

          {/* Engagement Summary Panel */}
          <div className="bg-gradient-to-br from-teal-50 to-sky-50 border border-teal-200 rounded-lg p-4 space-y-2">
            <h4 className="font-semibold text-teal-900">Engagement Summary</h4>
            <div className="grid grid-cols-2 gap-3 text-sm">
              <div>
                <p className="text-slate-600">Duration Selected:</p>
                <p className="font-semibold text-teal-800">{form.watch_duration}s</p>
              </div>
              <div>
                <p className="text-slate-600">Steps:</p>
                <p className="font-semibold text-teal-800">{engagementSummary.steps}</p>
              </div>
              <div>
                <p className="text-slate-600">Extra Cost:</p>
                <p className="font-semibold text-teal-800">+{engagementSummary.extraCost} coins</p>
              </div>
              <div>
                <p className="text-slate-600">Base Cost:</p>
                <p className="font-semibold text-teal-800">{formatCoinsValue(engagementSummary.baseCost)}</p>
              </div>
            </div>
            <div className="pt-2 border-t border-teal-200">
              <div className="flex justify-between items-center">
                <p className="text-slate-700 font-medium">Total Campaign Cost:</p>
                <p className="text-xl font-bold text-teal-900">{formatCoins(engagementSummary.totalCampaignCost)}</p>
              </div>
              <p className="text-xs text-slate-600 mt-1">
                You will be charged only when a visit completes the required watch time.
              </p>
            </div>
          </div>

          {/* Question Authoring */}
          <QuestionAuthoring
            questions={form.questions}
            onChange={handleQuestionsChange}
            error={questionError}
          />

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
                        {formatCoinsValue(c.coins_per_visit)} coins/visit • {c.watch_duration || 30}s watch • {c.clicks_served}/{c.total_clicks} clicks
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

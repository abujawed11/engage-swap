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
import { useURLValidation } from "../hooks/useURLValidation";
import { VALIDATION_STATE, getValidationIcon, getValidationStyles } from "../lib/urlValidator";

const isValidUrl = (u) => {
  try {
    const url = new URL(u);
    return url.protocol === "http:" || url.protocol === "https:";
  } catch {
    return false;
  }
};

// Helper to format time ago
const formatTimeAgo = (dateString) => {
  const date = new Date(dateString);
  const now = new Date();
  const diffInSeconds = Math.floor((now - date) / 1000);

  if (diffInSeconds < 60) return 'Just now';
  if (diffInSeconds < 3600) return `${Math.floor(diffInSeconds / 60)}m ago`;
  if (diffInSeconds < 86400) return `${Math.floor(diffInSeconds / 3600)}h ago`;
  if (diffInSeconds < 604800) return `${Math.floor(diffInSeconds / 86400)}d ago`;
  return `${Math.floor(diffInSeconds / 604800)}w ago`;
};

// Helper to get value tier
const getValueTier = (coinsPerVisit) => {
  const coins = parseFloat(coinsPerVisit);
  if (coins >= 10) return { label: 'HIGH', color: 'bg-purple-100 text-purple-700 border-purple-300' };
  if (coins >= 5) return { label: 'MEDIUM', color: 'bg-blue-100 text-blue-700 border-blue-300' };
  return { label: 'LOW', color: 'bg-gray-100 text-gray-600 border-gray-300' };
};

// Helper to calculate total budget
const calculateTotalBudgetForCampaign = (campaign) => {
  const baseCoins = parseFloat(campaign.coins_per_visit);
  const totalClicks = campaign.total_clicks;
  const duration = campaign.watch_duration || 30;

  // Calculate extra time cost (5 coins per 15s step beyond 30s)
  const steps = (duration - 30) / 15;
  const extraTime = steps > 0 ? 5 * steps : 0;

  // Total budget = (baseCoins × totalClicks) + extraTime
  return (baseCoins * totalClicks) + extraTime;
};

export default function Promote() {
  const { user, setUser } = useApp();
  const [campaigns, setCampaigns] = useState([]);
  const [activeTab, setActiveTab] = useState("create"); // "create" or "campaigns"
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

  // URL validation hook - only validate when URL is changed
  const urlValidation = useURLValidation(form.url, activeTab === "create" && form.url.length > 0);

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
    if (name === "title" || name === "url") {
      setForm((f) => ({ ...f, [name]: value }));
    } else if (name === "coins_per_visit") {
      // Round to 1 decimal place for coins_per_visit
      const numValue = parseFloat(value);
      if (!isNaN(numValue)) {
        setForm((f) => ({ ...f, [name]: Math.round(numValue * 10) / 10 }));
      }
    } else {
      setForm((f) => ({ ...f, [name]: Number(value) }));
    }
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

    // Check URL validation status
    if (urlValidation.isInvalid) {
      return setError(`URL validation failed: ${urlValidation.result?.message || 'Invalid URL'}`);
    }

    if (urlValidation.state === VALIDATION_STATE.VERIFYING || urlValidation.isValidating) {
      return setError("Please wait for URL validation to complete.");
    }

    if (urlValidation.state === VALIDATION_STATE.IDLE && form.url.trim()) {
      return setError("Please wait for URL validation to complete.");
    }

    if (!urlValidation.isValid) {
      return setError("URL must pass validation before creating campaign.");
    }

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
      urlValidation.reset();
      await fetchCampaigns();

      // Navigate to "Your Campaigns" tab to show the newly created campaign
      setActiveTab("campaigns");
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
        // Ensure both values are numbers to avoid string concatenation
        const currentCoins = Number(user.coins) || 0;
        const refundAmount = Number(result.refunded) || 0;
        setUser({ ...user, coins: currentCoins + refundAmount });

        // Show refund toast
        setToastMessage(`${formatCoinsValue(refundAmount)} coins refunded`);
        setToastType("refund");
        setShowToast(true);
        setTimeout(() => setShowToast(false), 3000);
      }

      await fetchCampaigns();
    } catch (err) {
      setError(err.message);
    }
  };

  const handleReAdd = async (campaign) => {
    // Pre-populate the form with the finished campaign's data
    // First, we need to fetch the campaign's questions
    try {
      // For now, we'll set the basic fields and let user reconfigure questions
      setForm({
        title: campaign.title,
        url: campaign.url,
        coins_per_visit: campaign.coins_per_visit,
        watch_duration: campaign.watch_duration || DEFAULT_WATCH_DURATION,
        total_clicks: campaign.total_clicks,
        questions: [] // User needs to reconfigure questions
      });

      // Switch to create tab
      setActiveTab("create");

      // Show a message to user
      setError("Campaign details loaded. Please reconfigure the questions and submit to create a new campaign.");
    } catch (err) {
      setError(err.message);
    }
  };

  return (
    <div>
      {/* Tab Navigation */}
      <div className="mb-6 border-b border-slate-200">
        <div className="flex gap-1">
          <button
            onClick={() => setActiveTab("create")}
            className={`px-6 py-3 font-semibold transition-colors relative ${
              activeTab === "create"
                ? "text-teal-600 border-b-2 border-teal-600"
                : "text-slate-600 hover:text-slate-800"
            }`}
          >
            Create Campaign
          </button>
          <button
            onClick={() => setActiveTab("campaigns")}
            className={`px-6 py-3 font-semibold transition-colors relative ${
              activeTab === "campaigns"
                ? "text-teal-600 border-b-2 border-teal-600"
                : "text-slate-600 hover:text-slate-800"
            }`}
          >
            Your Campaigns
            {campaigns.length > 0 && (
              <span className="ml-2 px-2 py-0.5 text-xs bg-teal-100 text-teal-700 rounded-full">
                {campaigns.length}
              </span>
            )}
          </button>
        </div>
      </div>

      {/* Tab Content */}
      {activeTab === "create" && (
        <Card>
          <h2 className="text-2xl font-semibold">Create New Campaign</h2>
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
            <div className="relative">
              <Input
                id="url"
                name="url"
                value={form.url}
                onChange={onChange}
                placeholder="https://example.com"
                className={getValidationStyles(urlValidation.state)}
              />
              {urlValidation.state !== VALIDATION_STATE.IDLE && (
                <div className="absolute right-3 top-1/2 -translate-y-1/2 text-xl">
                  {getValidationIcon(urlValidation.state)}
                </div>
              )}
            </div>

            {/* Validation Feedback */}
            {urlValidation.state === VALIDATION_STATE.VERIFYING && (
              <div className="mt-2 flex items-center gap-2 text-sm text-blue-700">
                <div className="animate-spin">🔍</div>
                <span>Verifying URL...</span>
              </div>
            )}

            {urlValidation.isValid && (
              <div className="mt-2 flex items-center gap-2 text-sm text-green-700 bg-green-50 border border-green-200 rounded px-3 py-2">
                <span>✅</span>
                <span className="font-medium">URL verified and accessible</span>
              </div>
            )}

            {urlValidation.isInvalid && urlValidation.result && (
              <div className="mt-2 text-sm text-red-700 bg-red-50 border border-red-200 rounded px-3 py-2">
                <div className="flex items-start gap-2">
                  <span className="text-lg">❌</span>
                  <div className="flex-1">
                    <p className="font-semibold">URL validation failed</p>
                    <p className="mt-1">{urlValidation.result.message}</p>
                    {urlValidation.result.rejectionReason && (
                      <p className="mt-1 text-xs text-red-600 font-mono">
                        Code: {urlValidation.result.rejectionReason}
                      </p>
                    )}
                  </div>
                </div>
              </div>
            )}

            {urlValidation.shouldRetry && urlValidation.result && (
              <div className="mt-2 text-sm text-yellow-800 bg-yellow-50 border border-yellow-200 rounded px-3 py-2">
                <div className="flex items-start gap-2">
                  <span className="text-lg">⚠️</span>
                  <div className="flex-1">
                    <p className="font-semibold">Unable to verify URL</p>
                    <p className="mt-1">{urlValidation.result.message}</p>
                    <button
                      type="button"
                      onClick={urlValidation.validateNow}
                      className="mt-2 text-xs bg-yellow-600 hover:bg-yellow-700 text-white px-3 py-1 rounded"
                    >
                      Retry Validation
                    </button>
                  </div>
                </div>
              </div>
            )}

            <p className="mt-1 text-xs text-slate-500">
              URL will be automatically validated for security and accessibility
            </p>
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
      )}

      {activeTab === "campaigns" && (
        <Card>
          <h2 className="text-2xl font-semibold">Your Campaigns</h2>
          <p className="mt-2 text-slate-600">
            Manage and monitor your active and finished campaigns.
          </p>
        {campaigns.length === 0 ? (
          <p className="mt-4 text-slate-600">No campaigns yet. Switch to "Create Campaign" tab to create your first one.</p>
        ) : (
          <ul className="mt-4 space-y-3">
            {campaigns.map((c) => {
              const valueTier = getValueTier(c.coins_per_visit);
              const totalBudget = calculateTotalBudgetForCampaign(c);

              return (
                <li key={c.id} className="rounded-lg border p-4">
                  <div className="flex items-start justify-between gap-4">
                    <div className="flex-1">
                      {/* Title and Badges */}
                      <div className="flex items-center gap-2 flex-wrap">
                        <div className="text-lg font-semibold">{c.title}</div>
                        <span
                          className={`text-xs px-2 py-0.5 rounded ${
                            c.is_finished
                              ? "bg-green-100 text-green-800"
                              : c.is_paused
                              ? "bg-slate-200 text-slate-700"
                              : "bg-teal-100 text-teal-800"
                          }`}
                        >
                          {c.is_finished ? "Finished" : c.is_paused ? "Paused" : "Active"}
                        </span>
                        <span className={`text-xs font-bold px-2 py-0.5 rounded border ${valueTier.color}`}>
                          {valueTier.label} VALUE
                        </span>
                        {c.created_at && (
                          <span className="text-xs text-slate-400">
                            • Created {formatTimeAgo(c.created_at)}
                          </span>
                        )}
                      </div>

                      {/* URL */}
                      <a
                        href={c.url}
                        target="_blank"
                        rel="noreferrer"
                        className="text-sm text-teal-700 break-all hover:underline"
                      >
                        {c.url}
                      </a>

                      {/* Stats */}
                      <div className="mt-2 flex items-center gap-4 text-sm text-slate-600 flex-wrap">
                        <span className="font-semibold text-teal-700">
                          +{formatCoinsValue(c.coins_per_visit)} coins
                        </span>
                        <span>•</span>
                        <span>{c.watch_duration || 30}s watch required</span>
                        <span>•</span>
                        <span>{c.clicks_served}/{c.total_clicks} completed</span>
                        <span>•</span>
                        <span className="text-xs text-slate-500">
                          Total Budget: {formatCoinsValue(totalBudget)}
                        </span>
                      </div>

                      {/* Progress bar */}
                      <div className="mt-2 w-full bg-slate-200 rounded-full h-2">
                        <div
                          className="bg-teal-600 h-2 rounded-full transition-all"
                          style={{ width: `${(c.clicks_served / c.total_clicks) * 100}%` }}
                        />
                      </div>
                    </div>

                    {/* Action Buttons */}
                    <div className="flex items-start gap-2 shrink-0">
                      {c.is_finished ? (
                        <Button
                          onClick={() => handleReAdd(c)}
                          className="text-xs px-2 py-1 h-auto bg-green-600 hover:bg-green-700"
                        >
                          Re-add
                        </Button>
                      ) : (
                        <Button
                          onClick={() => handlePauseResume(c)}
                          className="text-xs px-2 py-1 h-auto"
                        >
                          {c.is_paused ? "Resume" : "Pause"}
                        </Button>
                      )}
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
      )}

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

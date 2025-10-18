import React, { useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import Card from '../components/ui/Card';
import Button from '../components/ui/Button';
import { campaigns as campaignsAPI, analytics as analyticsAPI } from '../lib/api';
import { formatCoinsValue } from '../lib/coins';

export default function Analytics() {
  const navigate = useNavigate();
  const location = useLocation();
  const [activeTab, setActiveTab] = useState(location.state?.activeTab || 'earnings'); // 'earnings' or 'campaigns'
  const [campaigns, setCampaigns] = useState([]);
  const [loading, setLoading] = useState(false);

  // Update active tab when location state changes (e.g., coming back from detail page)
  useEffect(() => {
    if (location.state?.activeTab) {
      setActiveTab(location.state.activeTab);
    }
  }, [location.state]);

  // Fetch user's campaigns when on campaigns tab
  useEffect(() => {
    if (activeTab === 'campaigns') {
      fetchCampaigns();
    }
  }, [activeTab]);

  const fetchCampaigns = async () => {
    setLoading(true);
    try {
      const data = await campaignsAPI.listMine();
      setCampaigns(data.campaigns || []);
    } catch (err) {
      console.error('Failed to fetch campaigns:', err);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold text-slate-900">Analytics Dashboard</h1>
        <p className="text-slate-600 mt-1">Track your earnings and campaign performance</p>
      </div>

      {/* Tab Navigation */}
      <div className="border-b border-slate-200">
        <div className="flex gap-1">
          <button
            onClick={() => setActiveTab('earnings')}
            className={`px-6 py-3 font-semibold transition-colors relative ${
              activeTab === 'earnings'
                ? 'text-teal-600 border-b-2 border-teal-600'
                : 'text-slate-600 hover:text-slate-800'
            }`}
          >
            📊 My Earnings
          </button>
          <button
            onClick={() => setActiveTab('campaigns')}
            className={`px-6 py-3 font-semibold transition-colors relative ${
              activeTab === 'campaigns'
                ? 'text-teal-600 border-b-2 border-teal-600'
                : 'text-slate-600 hover:text-slate-800'
            }`}
          >
            🚀 My Campaigns
            {campaigns.length > 0 && (
              <span className="ml-2 px-2 py-0.5 text-xs bg-teal-100 text-teal-700 rounded-full">
                {campaigns.length}
              </span>
            )}
          </button>
        </div>
      </div>

      {/* Tab Content */}
      {activeTab === 'earnings' && <EarningsAnalytics />}
      {activeTab === 'campaigns' && <CampaignsAnalytics campaigns={campaigns} loading={loading} navigate={navigate} />}
    </div>
  );
}

// Earnings Analytics Component
function EarningsAnalytics() {
  const [earningsData, setEarningsData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    fetchEarningsData();
  }, []);

  const fetchEarningsData = async () => {
    setLoading(true);
    setError(null);
    try {
      const data = await analyticsAPI.getMyEarnings(50);
      setEarningsData(data);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <Card>
        <div className="text-center py-12">
          <div className="text-4xl mb-4">📊</div>
          <div className="text-slate-600">Loading earnings data...</div>
        </div>
      </Card>
    );
  }

  if (error) {
    return (
      <Card>
        <div className="text-center py-12">
          <div className="text-4xl mb-4">⚠️</div>
          <div className="text-red-600 font-semibold mb-2">Error loading earnings</div>
          <div className="text-slate-600">{error}</div>
        </div>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card>
          <div className="text-sm text-slate-600 mb-1">Total Visits</div>
          <div className="text-3xl font-bold text-slate-900">
            {earningsData?.summary.total_visits || 0}
          </div>
        </Card>

        <Card>
          <div className="text-sm text-slate-600 mb-1">Successful Completions</div>
          <div className="text-3xl font-bold text-teal-600">
            {earningsData?.summary.successful_visits || 0}
          </div>
          <div className="text-xs text-slate-500 mt-1">
            {earningsData?.summary.total_visits > 0
              ? `${((earningsData.summary.successful_visits / earningsData.summary.total_visits) * 100).toFixed(1)}% success rate`
              : '0% success rate'}
          </div>
        </Card>

        <Card>
          <div className="text-sm text-slate-600 mb-1">Total Earned</div>
          <div className="text-3xl font-bold text-green-600">
            {formatCoinsValue(earningsData?.summary.total_earned || 0)}
          </div>
        </Card>

        <Card>
          <div className="text-sm text-slate-600 mb-1">Avg per Visit</div>
          <div className="text-3xl font-bold text-purple-600">
            {formatCoinsValue(earningsData?.summary.avg_per_visit || 0)}
          </div>
        </Card>
      </div>

      {/* Recent Visits */}
      <Card>
        <h3 className="text-lg font-semibold mb-4">Recent Visit History</h3>

        {!earningsData?.recent_visits || earningsData.recent_visits.length === 0 ? (
          <div className="text-center py-12">
            <div className="text-4xl mb-4">🎯</div>
            <div className="text-slate-600 mb-2">No visits yet</div>
            <div className="text-sm text-slate-500">
              Start visiting campaigns from the Earn page to see your earnings history
            </div>
            <Button onClick={() => window.location.href = '/earn'} className="mt-4">
              Go to Earn Page
            </Button>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="bg-slate-50 border-b-2 border-slate-200">
                <tr>
                  <th className="text-left p-3 font-semibold">Campaign</th>
                  <th className="text-left p-3 font-semibold">Visited At</th>
                  <th className="text-right p-3 font-semibold">Status</th>
                  <th className="text-right p-3 font-semibold">Reward Type</th>
                  <th className="text-right p-3 font-semibold">Coins Earned</th>
                  <th className="text-right p-3 font-semibold">Quiz Score</th>
                </tr>
              </thead>
              <tbody>
                {earningsData.recent_visits.map((visit, idx) => (
                  <tr key={visit.id} className={idx % 2 === 0 ? 'bg-white' : 'bg-slate-50'}>
                    <td className="p-3">
                      <div className="font-medium">{visit.campaign_title}</div>
                      <div className="text-xs text-slate-500 truncate max-w-xs">{visit.campaign_url}</div>
                    </td>
                    <td className="p-3">{new Date(visit.visited_at).toLocaleString()}</td>
                    <td className="p-3 text-right">
                      <span className={`px-2 py-1 rounded text-xs font-medium ${
                        visit.is_rewarded
                          ? 'bg-green-100 text-green-800'
                          : visit.is_completed
                          ? 'bg-yellow-100 text-yellow-800'
                          : 'bg-red-100 text-red-800'
                      }`}>
                        {visit.is_rewarded ? 'Rewarded' : visit.is_completed ? 'Completed' : 'Failed'}
                      </span>
                    </td>
                    <td className="p-3 text-right">
                      {visit.reward_type ? (
                        <span className={`px-2 py-1 rounded text-xs font-medium ${
                          visit.reward_type === 'bonus'
                            ? 'bg-purple-100 text-purple-800'
                            : visit.reward_type === 'quiz'
                            ? 'bg-blue-100 text-blue-800'
                            : 'bg-slate-100 text-slate-700'
                        }`}>
                          {visit.reward_type === 'bonus' ? '🎁 Bonus' : visit.reward_type === 'quiz' ? '✅ Quiz' : 'Not Eligible'}
                        </span>
                      ) : (
                        <span className="text-slate-400">-</span>
                      )}
                    </td>
                    <td className="p-3 text-right font-semibold">
                      {visit.coins_earned > 0 ? (
                        <span className="text-green-700">+{formatCoinsValue(visit.coins_earned)}</span>
                      ) : (
                        <span className="text-slate-500">0</span>
                      )}
                    </td>
                    <td className="p-3 text-right">
                      {visit.quiz_score !== null ? (
                        <span className={visit.quiz_score >= 80 ? 'text-green-700 font-semibold' : 'text-slate-700'}>
                          {visit.quiz_score}%
                        </span>
                      ) : (
                        <span className="text-slate-400">-</span>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </Card>
    </div>
  );
}

// Campaigns Analytics Component
function CampaignsAnalytics({ campaigns, loading, navigate }) {
  const [analyticsData, setAnalyticsData] = useState(null);
  const [analyticsLoading, setAnalyticsLoading] = useState(true);
  const [analyticsError, setAnalyticsError] = useState(null);
  const [dateRange, setDateRange] = useState(7); // 7, 14, or 30 days
  const [sortConfig, setSortConfig] = useState({ key: 'visits', direction: 'desc' });

  // Fetch analytics summary when date range changes
  useEffect(() => {
    if (campaigns.length > 0) {
      fetchAnalyticsSummary();
    } else {
      setAnalyticsLoading(false);
    }
  }, [dateRange, campaigns.length]);

  const fetchAnalyticsSummary = async () => {
    setAnalyticsLoading(true);
    setAnalyticsError(null);
    try {
      const data = await analyticsAPI.getMyCampaignsSummary(dateRange);
      setAnalyticsData(data);
    } catch (err) {
      setAnalyticsError(err.message);
    } finally {
      setAnalyticsLoading(false);
    }
  };

  // Sort campaigns
  const sortedCampaigns = React.useMemo(() => {
    if (!analyticsData?.campaigns) return [];

    const sorted = [...analyticsData.campaigns];
    sorted.sort((a, b) => {
      let aVal = a[sortConfig.key];
      let bVal = b[sortConfig.key];

      // Handle string sorting (for title and status)
      if (typeof aVal === 'string') {
        aVal = aVal.toLowerCase();
        bVal = bVal.toLowerCase();
      }

      if (sortConfig.direction === 'asc') {
        return aVal > bVal ? 1 : -1;
      } else {
        return aVal < bVal ? 1 : -1;
      }
    });

    return sorted;
  }, [analyticsData, sortConfig]);

  const handleSort = (key) => {
    setSortConfig(prev => ({
      key,
      direction: prev.key === key && prev.direction === 'desc' ? 'asc' : 'desc'
    }));
  };

  // Loading state
  if (loading || analyticsLoading) {
    return (
      <Card>
        <div className="text-center py-12">
          <div className="text-4xl mb-4">📊</div>
          <div className="text-slate-600">Loading campaign analytics...</div>
        </div>
      </Card>
    );
  }

  // Error state
  if (analyticsError) {
    return (
      <Card>
        <div className="text-center py-12">
          <div className="text-4xl mb-4">⚠️</div>
          <div className="text-red-600 font-semibold mb-2">Error loading analytics</div>
          <div className="text-slate-600 mb-4">{analyticsError}</div>
          <Button onClick={fetchAnalyticsSummary}>Retry</Button>
        </div>
      </Card>
    );
  }

  // Empty state
  if (campaigns.length === 0) {
    return (
      <Card>
        <div className="text-center py-12">
          <div className="text-4xl mb-4">🚀</div>
          <div className="text-slate-600 mb-2">No campaigns yet</div>
          <div className="text-sm text-slate-500 mb-4">
            Create your first campaign to start promoting your content
          </div>
          <Button onClick={() => navigate('/promote')}>
            Create Campaign
          </Button>
        </div>
      </Card>
    );
  }

  const { summary, date_range } = analyticsData || {};

  return (
    <div className="space-y-6">
      {/* Date Range Selector */}
      <Card className="bg-slate-50">
        <div className="flex items-center justify-between flex-wrap gap-4">
          <div>
            <div className="text-sm font-semibold text-slate-700 mb-2">Time Period</div>
            <div className="flex gap-2">
              <button
                onClick={() => setDateRange(7)}
                className={`px-4 py-2 rounded-lg text-sm font-medium transition-all ${
                  dateRange === 7
                    ? 'bg-emerald-600 text-white shadow-md'
                    : 'bg-white text-slate-700 hover:bg-slate-100 border border-slate-300'
                }`}
              >
                Last 7 days
              </button>
              <button
                onClick={() => setDateRange(14)}
                className={`px-4 py-2 rounded-lg text-sm font-medium transition-all ${
                  dateRange === 14
                    ? 'bg-emerald-600 text-white shadow-md'
                    : 'bg-white text-slate-700 hover:bg-slate-100 border border-slate-300'
                }`}
              >
                Last 14 days
              </button>
              <button
                onClick={() => setDateRange(30)}
                className={`px-4 py-2 rounded-lg text-sm font-medium transition-all ${
                  dateRange === 30
                    ? 'bg-emerald-600 text-white shadow-md'
                    : 'bg-white text-slate-700 hover:bg-slate-100 border border-slate-300'
                }`}
              >
                Last 30 days
              </button>
            </div>
          </div>
          <div className="text-xs text-slate-500">
            {date_range?.from} to {date_range?.to} (IST)
          </div>
        </div>
      </Card>

      {/* Summary KPI Tiles */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card className="bg-gradient-to-br from-blue-50 to-blue-100 border-blue-200">
          <div className="text-xs uppercase tracking-wide text-blue-700 font-semibold mb-1">Total Visits</div>
          <div className="text-3xl font-bold text-blue-900 font-mono">
            {summary?.total_visits?.toLocaleString() || 0}
          </div>
        </Card>

        <Card className="bg-gradient-to-br from-emerald-50 to-emerald-100 border-emerald-200">
          <div className="text-xs uppercase tracking-wide text-emerald-700 font-semibold mb-1">Completions</div>
          <div className="text-3xl font-bold text-emerald-900 font-mono">
            {summary?.total_completions?.toLocaleString() || 0}
          </div>
          <div className="text-xs text-emerald-700 mt-1">
            {summary?.avg_completion_rate?.toFixed(1) || 0}% completion rate
          </div>
        </Card>

        <Card className="bg-gradient-to-br from-orange-50 to-orange-100 border-orange-200">
          <div className="text-xs uppercase tracking-wide text-orange-700 font-semibold mb-1">Coins Spent</div>
          <div className="text-3xl font-bold text-orange-900 font-mono">
            {formatCoinsValue(summary?.total_coins_spent || 0)}
          </div>
        </Card>

        <Card className="bg-gradient-to-br from-purple-50 to-purple-100 border-purple-200">
          <div className="text-xs uppercase tracking-wide text-purple-700 font-semibold mb-1">Avg Cost/Completion</div>
          <div className="text-3xl font-bold text-purple-900 font-mono">
            {formatCoinsValue(summary?.avg_coins_per_completion || 0)}
          </div>
        </Card>
      </div>

      {/* Campaign Comparison Table */}
      <Card>
        <h3 className="text-lg font-semibold mb-4">Campaign Performance</h3>

        {sortedCampaigns.length === 0 ? (
          <div className="text-center py-8 text-slate-600">
            No analytics data available for the selected time period
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="bg-slate-50 border-b-2 border-slate-200">
                <tr>
                  <th
                    className="text-left p-3 font-semibold cursor-pointer hover:bg-slate-100 transition-colors"
                    onClick={() => handleSort('title')}
                  >
                    Campaign {sortConfig.key === 'title' && (sortConfig.direction === 'asc' ? '↑' : '↓')}
                  </th>
                  <th
                    className="text-center p-3 font-semibold cursor-pointer hover:bg-slate-100 transition-colors"
                    onClick={() => handleSort('status')}
                  >
                    Status {sortConfig.key === 'status' && (sortConfig.direction === 'asc' ? '↑' : '↓')}
                  </th>
                  <th
                    className="text-right p-3 font-semibold cursor-pointer hover:bg-slate-100 transition-colors"
                    onClick={() => handleSort('visits')}
                  >
                    Visits {sortConfig.key === 'visits' && (sortConfig.direction === 'asc' ? '↑' : '↓')}
                  </th>
                  <th
                    className="text-right p-3 font-semibold cursor-pointer hover:bg-slate-100 transition-colors"
                    onClick={() => handleSort('completions')}
                  >
                    Completions {sortConfig.key === 'completions' && (sortConfig.direction === 'asc' ? '↑' : '↓')}
                  </th>
                  <th
                    className="text-right p-3 font-semibold cursor-pointer hover:bg-slate-100 transition-colors"
                    onClick={() => handleSort('completion_rate')}
                  >
                    Rate {sortConfig.key === 'completion_rate' && (sortConfig.direction === 'asc' ? '↑' : '↓')}
                  </th>
                  <th
                    className="text-right p-3 font-semibold cursor-pointer hover:bg-slate-100 transition-colors"
                    onClick={() => handleSort('coins_spent')}
                  >
                    Coins Spent {sortConfig.key === 'coins_spent' && (sortConfig.direction === 'asc' ? '↑' : '↓')}
                  </th>
                  <th
                    className="text-right p-3 font-semibold cursor-pointer hover:bg-slate-100 transition-colors"
                    onClick={() => handleSort('coins_per_completion')}
                  >
                    Cost/Compl {sortConfig.key === 'coins_per_completion' && (sortConfig.direction === 'asc' ? '↑' : '↓')}
                  </th>
                </tr>
              </thead>
              <tbody>
                {sortedCampaigns.map((campaign, idx) => (
                  <tr
                    key={campaign.id}
                    className={`${idx % 2 === 0 ? 'bg-white' : 'bg-slate-50'} hover:bg-emerald-50 transition-colors cursor-pointer`}
                    onClick={() => navigate(`/analytics/campaign/${campaign.id}`)}
                  >
                    <td className="p-3">
                      <div className="font-semibold text-slate-900">{campaign.title}</div>
                      <div className="text-xs text-slate-500">
                        {campaign.clicks_served.toLocaleString()}/{campaign.total_clicks.toLocaleString()} clicks served
                      </div>
                    </td>
                    <td className="p-3 text-center">
                      <span className={`px-2 py-1 rounded text-xs font-medium ${
                        campaign.status === 'finished'
                          ? 'bg-green-100 text-green-800'
                          : campaign.status === 'paused'
                          ? 'bg-slate-200 text-slate-700'
                          : 'bg-emerald-100 text-emerald-800'
                      }`}>
                        {campaign.status === 'finished' ? 'Finished' : campaign.status === 'paused' ? 'Paused' : 'Active'}
                      </span>
                    </td>
                    <td className="p-3 text-right font-mono">{campaign.visits.toLocaleString()}</td>
                    <td className="p-3 text-right font-mono text-emerald-700 font-semibold">
                      {campaign.completions.toLocaleString()}
                    </td>
                    <td className="p-3 text-right font-mono">
                      <span className={campaign.completion_rate >= 60 ? 'text-green-700 font-semibold' : 'text-slate-700'}>
                        {campaign.completion_rate.toFixed(1)}%
                      </span>
                    </td>
                    <td className="p-3 text-right font-mono text-orange-700">
                      {formatCoinsValue(campaign.coins_spent)}
                    </td>
                    <td className="p-3 text-right font-mono">
                      {formatCoinsValue(campaign.coins_per_completion)}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </Card>
    </div>
  );
}

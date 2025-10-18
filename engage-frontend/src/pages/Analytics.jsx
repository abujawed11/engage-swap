import { useState, useEffect } from 'react';
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
  if (loading) {
    return (
      <Card>
        <div className="text-center py-12">
          <div className="text-4xl mb-4">🚀</div>
          <div className="text-slate-600">Loading your campaigns...</div>
        </div>
      </Card>
    );
  }

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

  return (
    <div className="space-y-6">
      {/* Campaign List */}
      <Card>
        <h3 className="text-lg font-semibold mb-4">Your Campaigns</h3>
        <div className="space-y-4">
          {campaigns.map((campaign) => (
            <div
              key={campaign.id}
              className="border rounded-lg p-4 hover:border-teal-300 transition-colors"
            >
              <div className="flex items-start justify-between gap-4">
                <div className="flex-1">
                  <div className="flex items-center gap-2 flex-wrap mb-2">
                    <h4 className="text-lg font-semibold">{campaign.title}</h4>
                    <span className={`px-2 py-0.5 rounded text-xs font-medium ${
                      campaign.is_finished
                        ? 'bg-green-100 text-green-800'
                        : campaign.is_paused
                        ? 'bg-slate-200 text-slate-700'
                        : 'bg-teal-100 text-teal-800'
                    }`}>
                      {campaign.is_finished ? 'Finished' : campaign.is_paused ? 'Paused' : 'Active'}
                    </span>
                  </div>

                  <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm mb-3">
                    <div>
                      <div className="text-slate-600">Reward</div>
                      <div className="font-semibold text-teal-700">
                        +{formatCoinsValue(campaign.coins_per_visit)} coins
                      </div>
                    </div>
                    <div>
                      <div className="text-slate-600">Served</div>
                      <div className="font-semibold">{campaign.clicks_served}/{campaign.total_clicks}</div>
                    </div>
                    <div>
                      <div className="text-slate-600">Remaining</div>
                      <div className="font-semibold">{campaign.clicks_remaining}</div>
                    </div>
                    <div>
                      <div className="text-slate-600">Progress</div>
                      <div className="font-semibold">
                        {((campaign.clicks_served / campaign.total_clicks) * 100).toFixed(1)}%
                      </div>
                    </div>
                  </div>

                  {/* Progress bar */}
                  <div className="w-full bg-slate-200 rounded-full h-2">
                    <div
                      className="bg-teal-600 h-2 rounded-full transition-all"
                      style={{ width: `${(campaign.clicks_served / campaign.total_clicks) * 100}%` }}
                    />
                  </div>
                </div>

                <div>
                  <Button
                    onClick={() => navigate(`/analytics/campaign/${campaign.id}`)}
                    className="text-sm px-4 py-2 bg-blue-600 hover:bg-blue-700"
                  >
                    📊 View Details
                  </Button>
                </div>
              </div>
            </div>
          ))}
        </div>
      </Card>
    </div>
  );
}

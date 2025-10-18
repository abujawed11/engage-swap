import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import Card from '../components/ui/Card';
import Button from '../components/ui/Button';
import { analytics } from '../lib/api';
import { formatCoinsValue } from '../lib/coins';

export default function CampaignAnalytics() {
  const { campaignId } = useParams();
  const navigate = useNavigate();

  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [exporting, setExporting] = useState(false);

  // Date range state
  const [dateRange, setDateRange] = useState('7d'); // 7d, 14d, 30d, custom
  const [customFrom, setCustomFrom] = useState('');
  const [customTo, setCustomTo] = useState('');

  // Fetch analytics data
  useEffect(() => {
    if (!campaignId) return;
    fetchAnalytics();
  }, [campaignId, dateRange, customFrom, customTo]);

  const fetchAnalytics = async () => {
    setLoading(true);
    setError(null);

    try {
      let fromDate, toDate;

      if (dateRange === 'custom') {
        fromDate = customFrom;
        toDate = customTo;
      } else {
        // Use default date ranges (backend will handle defaults)
        fromDate = undefined;
        toDate = undefined;

        if (dateRange === '14d') {
          const to = new Date();
          const from = new Date();
          from.setDate(from.getDate() - 13);
          fromDate = from.toISOString().split('T')[0];
          toDate = to.toISOString().split('T')[0];
        } else if (dateRange === '30d') {
          const to = new Date();
          const from = new Date();
          from.setDate(from.getDate() - 29);
          fromDate = from.toISOString().split('T')[0];
          toDate = to.toISOString().split('T')[0];
        }
      }

      const result = await analytics.getCampaignAnalytics(campaignId, fromDate, toDate);
      setData(result);
    } catch (err) {
      setError(err.message);
      if (err.code === 'FORBIDDEN') {
        setTimeout(() => navigate('/analytics'), 2000);
      }
    } finally {
      setLoading(false);
    }
  };

  const handleExport = async () => {
    setExporting(true);
    try {
      let fromDate, toDate;

      if (dateRange === 'custom') {
        fromDate = customFrom;
        toDate = customTo;
      }

      await analytics.exportCampaignAnalytics(campaignId, fromDate, toDate);
    } catch (err) {
      setError(err.message);
    } finally {
      setExporting(false);
    }
  };

  const handleBack = () => {
    // Navigate back to Analytics page, My Campaigns tab
    navigate('/analytics', { state: { activeTab: 'campaigns' } });
  };

  if (loading) {
    return (
      <Card>
        <div className="text-center py-12">
          <div className="text-4xl mb-4">📊</div>
          <div className="text-slate-600">Loading analytics...</div>
        </div>
      </Card>
    );
  }

  if (error) {
    return (
      <Card>
        <div className="text-center py-12">
          <div className="text-4xl mb-4">⚠️</div>
          <div className="text-red-600 font-semibold mb-2">Error loading analytics</div>
          <div className="text-slate-600">{error}</div>
          <Button onClick={handleBack} className="mt-4">
            Back to My Campaigns
          </Button>
        </div>
      </Card>
    );
  }

  if (!data) return null;

  const { campaign, date_range, totals, daily_series } = data;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-start justify-between gap-4">
        <div>
          <Button onClick={handleBack} className="mb-2 text-sm px-3 py-1 h-auto">
            ← Back to My Campaigns
          </Button>
          <h1 className="text-3xl font-bold text-slate-900">{campaign.title}</h1>
          <p className="text-slate-600 mt-1">Campaign Analytics Dashboard</p>
        </div>
        <div className="flex gap-2">
          <Button onClick={handleExport} disabled={exporting} className="text-sm">
            {exporting ? 'Exporting...' : '📥 Export CSV'}
          </Button>
        </div>
      </div>

      {/* Date Range Selector */}
      <Card>
        <div className="flex items-center gap-4 flex-wrap">
          <div className="text-sm font-semibold text-slate-700">Date Range:</div>
          <div className="flex gap-2">
            <button
              onClick={() => setDateRange('7d')}
              className={`px-3 py-1.5 rounded text-sm font-medium transition ${
                dateRange === '7d'
                  ? 'bg-teal-600 text-white'
                  : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
              }`}
            >
              Last 7 days
            </button>
            <button
              onClick={() => setDateRange('14d')}
              className={`px-3 py-1.5 rounded text-sm font-medium transition ${
                dateRange === '14d'
                  ? 'bg-teal-600 text-white'
                  : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
              }`}
            >
              Last 14 days
            </button>
            <button
              onClick={() => setDateRange('30d')}
              className={`px-3 py-1.5 rounded text-sm font-medium transition ${
                dateRange === '30d'
                  ? 'bg-teal-600 text-white'
                  : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
              }`}
            >
              Last 30 days
            </button>
            <button
              onClick={() => setDateRange('custom')}
              className={`px-3 py-1.5 rounded text-sm font-medium transition ${
                dateRange === 'custom'
                  ? 'bg-teal-600 text-white'
                  : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
              }`}
            >
              Custom
            </button>
          </div>

          {dateRange === 'custom' && (
            <div className="flex items-center gap-2">
              <input
                type="date"
                value={customFrom}
                onChange={(e) => setCustomFrom(e.target.value)}
                className="px-3 py-1.5 border border-slate-300 rounded text-sm"
              />
              <span className="text-slate-600">to</span>
              <input
                type="date"
                value={customTo}
                onChange={(e) => setCustomTo(e.target.value)}
                className="px-3 py-1.5 border border-slate-300 rounded text-sm"
              />
            </div>
          )}
        </div>
        <div className="mt-2 text-xs text-slate-500">
          Showing: {date_range.from} to {date_range.to} ({date_range.timezone})
        </div>
      </Card>

      {/* Campaign Info */}
      <Card>
        <h3 className="text-lg font-semibold mb-4">Campaign Overview</h3>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
          <div>
            <div className="text-slate-600">Reward per Visit</div>
            <div className="font-semibold text-teal-700 text-lg">
              +{formatCoinsValue(campaign.coins_per_visit)} coins
            </div>
          </div>
          <div>
            <div className="text-slate-600">Total Clicks</div>
            <div className="font-semibold text-lg">{campaign.total_clicks.toLocaleString()}</div>
          </div>
          <div>
            <div className="text-slate-600">Clicks Served</div>
            <div className="font-semibold text-lg">{campaign.clicks_served.toLocaleString()}</div>
          </div>
          <div>
            <div className="text-slate-600">Remaining</div>
            <div className="font-semibold text-lg">{campaign.clicks_remaining.toLocaleString()}</div>
          </div>
        </div>
        <div className="mt-4 flex items-center gap-4">
          <span className={`px-3 py-1 rounded text-sm font-medium ${
            campaign.is_finished
              ? 'bg-green-100 text-green-800'
              : campaign.is_paused
              ? 'bg-slate-200 text-slate-700'
              : 'bg-teal-100 text-teal-800'
          }`}>
            {campaign.is_finished ? 'Finished' : campaign.is_paused ? 'Paused' : 'Active'}
          </span>
        </div>
      </Card>

      {/* KPI Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card>
          <div className="text-sm text-slate-600 mb-1">Total Visits</div>
          <div className="text-3xl font-bold text-slate-900">{totals.total_visits.toLocaleString()}</div>
        </Card>

        <Card>
          <div className="text-sm text-slate-600 mb-1">Completions</div>
          <div className="text-3xl font-bold text-teal-600">{totals.completed_visits.toLocaleString()}</div>
          <div className="text-xs text-slate-500 mt-1">
            {totals.completion_rate.toFixed(1)}% completion rate
          </div>
        </Card>

        <Card>
          <div className="text-sm text-slate-600 mb-1">Avg Quiz Accuracy</div>
          <div className="text-3xl font-bold text-purple-600">{totals.avg_quiz_accuracy.toFixed(1)}%</div>
        </Card>

        <Card>
          <div className="text-sm text-slate-600 mb-1">Total Coins Spent</div>
          <div className="text-3xl font-bold text-orange-600">{formatCoinsValue(totals.coins_spent)}</div>
          <div className="text-xs text-slate-500 mt-1">
            {totals.coins_per_completion > 0 ? `${formatCoinsValue(totals.coins_per_completion)} per completion` : ''}
          </div>
        </Card>
      </div>

      {/* Daily Trends Table */}
      <Card>
        <h3 className="text-lg font-semibold mb-4">Daily Performance</h3>
        {daily_series.length === 0 ? (
          <div className="text-center py-8 text-slate-600">
            No data available for the selected date range
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="bg-slate-50 border-b-2 border-slate-200">
                <tr>
                  <th className="text-left p-3 font-semibold">Date</th>
                  <th className="text-right p-3 font-semibold">Visits</th>
                  <th className="text-right p-3 font-semibold">Completions</th>
                  <th className="text-right p-3 font-semibold">Rate</th>
                  <th className="text-right p-3 font-semibold">Avg Watch Time</th>
                  <th className="text-right p-3 font-semibold">Quiz Accuracy</th>
                  <th className="text-right p-3 font-semibold">Coins Spent</th>
                </tr>
              </thead>
              <tbody>
                {daily_series.map((row, idx) => (
                  <tr key={row.date} className={idx % 2 === 0 ? 'bg-white' : 'bg-slate-50'}>
                    <td className="p-3 font-medium">{row.date}</td>
                    <td className="p-3 text-right">{row.visits.toLocaleString()}</td>
                    <td className="p-3 text-right text-teal-700 font-semibold">{row.completions.toLocaleString()}</td>
                    <td className="p-3 text-right">{row.completion_rate.toFixed(1)}%</td>
                    <td className="p-3 text-right">{row.avg_watch_time.toFixed(0)}s</td>
                    <td className="p-3 text-right">{row.avg_quiz_accuracy.toFixed(1)}%</td>
                    <td className="p-3 text-right">{formatCoinsValue(row.coins_spent)}</td>
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

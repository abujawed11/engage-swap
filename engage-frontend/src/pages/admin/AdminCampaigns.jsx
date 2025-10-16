import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import Card from '../../components/ui/Card';
import Button from '../../components/ui/Button';
import { adminAPI } from '../../lib/adminApi';
import { formatCoinsValue } from '../../lib/coins';

export default function AdminCampaigns() {
  const [campaigns, setCampaigns] = useState([]);
  const [pagination, setPagination] = useState({});
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [page, setPage] = useState(1);
  const [status, setStatus] = useState('');

  useEffect(() => {
    fetchCampaigns();
  }, [page, status]);

  const fetchCampaigns = async () => {
    try {
      setLoading(true);
      const params = { page, limit: 20 };
      if (status) params.status = status;

      const data = await adminAPI.getCampaigns(params);
      setCampaigns(data.campaigns);
      setPagination(data.pagination);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-3xl font-bold">Campaign Management</h1>
        <Link
          to="/admin"
          className="px-4 py-2 bg-slate-600 text-white rounded hover:bg-slate-700 transition"
        >
          ← Back to Dashboard
        </Link>
      </div>

      {error && (
        <Card>
          <div className="text-sm text-red-700 bg-red-50 border border-red-200 rounded px-3 py-2">
            {error}
          </div>
        </Card>
      )}

      {/* Filters */}
      <Card>
        <div className="flex gap-3">
          <select
            value={status}
            onChange={(e) => {
              setStatus(e.target.value);
              setPage(1);
            }}
            className="px-3 py-2 border border-slate-300 rounded"
          >
            <option value="">All Campaigns</option>
            <option value="active">Active</option>
            <option value="paused">Paused</option>
            <option value="finished">Finished</option>
          </select>

          {status && (
            <Button
              onClick={() => {
                setStatus('');
                setPage(1);
              }}
              className="bg-slate-500 hover:bg-slate-600"
            >
              Clear Filter
            </Button>
          )}
        </div>
      </Card>

      {/* Campaigns Table */}
      <Card>
        <div className="mb-4">
          <h2 className="text-xl font-semibold">
            Campaigns ({pagination.total?.toLocaleString() || 0})
          </h2>
        </div>

        {loading ? (
          <p className="text-slate-600">Loading...</p>
        ) : campaigns.length === 0 ? (
          <p className="text-slate-600">No campaigns found</p>
        ) : (
          <>
            <div className="space-y-3">
              {campaigns.map((campaign) => (
                <div key={campaign.id} className="border border-slate-300 rounded p-4">
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <div className="flex items-center gap-2">
                        <div className="font-semibold text-lg">{campaign.title}</div>
                        <span className="text-xs text-slate-500">
                          by @{campaign.owner_username}
                        </span>
                      </div>

                      <a
                        href={campaign.url}
                        target="_blank"
                        rel="noreferrer"
                        className="text-sm text-teal-700 hover:underline break-all"
                      >
                        {campaign.url}
                      </a>

                      <div className="mt-2 flex items-center gap-4 text-sm">
                        <span className="text-teal-700 font-medium">
                          {formatCoinsValue(campaign.coins_per_visit)} per visit
                        </span>
                        <span>•</span>
                        <span>{campaign.watch_duration}s watch</span>
                        <span>•</span>
                        <span>
                          {campaign.clicks_served}/{campaign.total_clicks} completed
                        </span>
                      </div>

                      <div className="mt-2 w-full bg-slate-200 rounded-full h-2">
                        <div
                          className="bg-teal-600 h-2 rounded-full"
                          style={{
                            width: `${
                              (campaign.clicks_served / campaign.total_clicks) * 100
                            }%`,
                          }}
                        />
                      </div>
                    </div>

                    <div className="ml-4 flex flex-col gap-2">
                      {campaign.is_finished && (
                        <span className="text-xs bg-slate-200 text-slate-700 px-3 py-1 rounded text-center">
                          Finished
                        </span>
                      )}
                      {campaign.is_paused && (
                        <span className="text-xs bg-yellow-200 text-yellow-800 px-3 py-1 rounded text-center">
                          Paused
                        </span>
                      )}
                      {!campaign.is_finished && !campaign.is_paused && (
                        <span className="text-xs bg-green-200 text-green-800 px-3 py-1 rounded text-center">
                          Active
                        </span>
                      )}
                      <span className="text-xs text-slate-500">
                        {new Date(campaign.created_at).toLocaleDateString()}
                      </span>
                    </div>
                  </div>
                </div>
              ))}
            </div>

            {/* Pagination */}
            {pagination.total_pages > 1 && (
              <div className="mt-4 flex items-center justify-center gap-2">
                <Button
                  onClick={() => setPage(page - 1)}
                  disabled={page === 1}
                  className="text-sm"
                >
                  ← Previous
                </Button>
                <span className="text-sm text-slate-600">
                  Page {page} of {pagination.total_pages}
                </span>
                <Button
                  onClick={() => setPage(page + 1)}
                  disabled={page === pagination.total_pages}
                  className="text-sm"
                >
                  Next →
                </Button>
              </div>
            )}
          </>
        )}
      </Card>
    </div>
  );
}

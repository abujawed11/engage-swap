import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import Card from '../../components/ui/Card';
import Button from '../../components/ui/Button';
import { adminAPI } from '../../lib/adminApi';

export default function AdminLogs() {
  const [logs, setLogs] = useState([]);
  const [pagination, setPagination] = useState({});
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [page, setPage] = useState(1);
  const [outcome, setOutcome] = useState('');
  const [tier, setTier] = useState('');

  useEffect(() => {
    fetchLogs();
  }, [page, outcome, tier]);

  const fetchLogs = async () => {
    try {
      setLoading(true);
      const params = { page, limit: 50 };
      if (outcome) params.outcome = outcome;
      if (tier) params.tier = tier;

      const data = await adminAPI.getEnforcementLogs(params);
      setLogs(data.logs);
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
        <h1 className="text-3xl font-bold">Enforcement Logs</h1>
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
            value={outcome}
            onChange={(e) => {
              setOutcome(e.target.value);
              setPage(1);
            }}
            className="px-3 py-2 border border-slate-300 rounded"
          >
            <option value="">All Outcomes</option>
            <option value="ALLOW">ALLOW</option>
            <option value="LIMIT_REACHED">LIMIT_REACHED</option>
            <option value="COOLDOWN_ACTIVE">COOLDOWN_ACTIVE</option>
          </select>

          <select
            value={tier}
            onChange={(e) => {
              setTier(e.target.value);
              setPage(1);
            }}
            className="px-3 py-2 border border-slate-300 rounded"
          >
            <option value="">All Tiers</option>
            <option value="HIGH">HIGH</option>
            <option value="MEDIUM">MEDIUM</option>
            <option value="LOW">LOW</option>
          </select>

          {(outcome || tier) && (
            <Button
              onClick={() => {
                setOutcome('');
                setTier('');
                setPage(1);
              }}
              className="bg-slate-500 hover:bg-slate-600"
            >
              Clear Filters
            </Button>
          )}
        </div>
      </Card>

      {/* Logs Table */}
      <Card>
        <div className="mb-4">
          <h2 className="text-xl font-semibold">
            Logs ({pagination.total?.toLocaleString() || 0})
          </h2>
        </div>

        {loading ? (
          <p className="text-slate-600">Loading...</p>
        ) : logs.length === 0 ? (
          <p className="text-slate-600">No logs found</p>
        ) : (
          <>
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-slate-100 border-b border-slate-300">
                  <tr>
                    <th className="text-left px-4 py-2 text-sm">User</th>
                    <th className="text-left px-4 py-2 text-sm">Campaign</th>
                    <th className="text-left px-4 py-2 text-sm">Outcome</th>
                    <th className="text-left px-4 py-2 text-sm">Tier</th>
                    <th className="text-right px-4 py-2 text-sm">Coins</th>
                    <th className="text-left px-4 py-2 text-sm">Date</th>
                  </tr>
                </thead>
                <tbody>
                  {logs.map((log) => (
                    <tr key={log.id} className="border-b border-slate-200">
                      <td className="px-4 py-2 text-sm">{log.username}</td>
                      <td className="px-4 py-2 text-sm">{log.campaign_title || 'N/A'}</td>
                      <td className="px-4 py-2 text-sm">
                        <span
                          className={`text-xs px-2 py-1 rounded ${
                            log.outcome === 'ALLOW'
                              ? 'bg-green-100 text-green-800'
                              : log.outcome === 'LIMIT_REACHED'
                              ? 'bg-red-100 text-red-800'
                              : 'bg-yellow-100 text-yellow-800'
                          }`}
                        >
                          {log.outcome}
                        </span>
                      </td>
                      <td className="px-4 py-2 text-sm">
                        <span className="text-xs bg-slate-200 px-2 py-1 rounded">
                          {log.value_tier}
                        </span>
                      </td>
                      <td className="px-4 py-2 text-sm text-right">{log.coins_per_visit}</td>
                      <td className="px-4 py-2 text-sm text-slate-600">
                        {new Date(log.created_at).toLocaleString()}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
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

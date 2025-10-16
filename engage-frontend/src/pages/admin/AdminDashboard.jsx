import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import Card from '../../components/ui/Card';
import { adminAPI } from '../../lib/adminApi';
import { formatCoinsValue } from '../../lib/coins';

export default function AdminDashboard() {
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    fetchStats();
  }, []);

  const fetchStats = async () => {
    try {
      setLoading(true);
      const data = await adminAPI.getStats();
      setStats(data);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="space-y-6">
        <h1 className="text-3xl font-bold">Admin Dashboard</h1>
        <Card>
          <p className="text-slate-600">Loading...</p>
        </Card>
      </div>
    );
  }

  if (error) {
    return (
      <div className="space-y-6">
        <h1 className="text-3xl font-bold">Admin Dashboard</h1>
        <Card>
          <p className="text-red-600">{error}</p>
        </Card>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-3xl font-bold">Admin Dashboard</h1>
        <div className="flex gap-2">
          <Link
            to="/admin/users"
            className="px-4 py-2 bg-teal-600 text-white rounded hover:bg-teal-700 transition"
          >
            Manage Users
          </Link>
          <Link
            to="/admin/limits"
            className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 transition"
          >
            Configure Limits
          </Link>
          <Link
            to="/admin/logs"
            className="px-4 py-2 bg-purple-600 text-white rounded hover:bg-purple-700 transition"
          >
            View Logs
          </Link>
        </div>
      </div>

      {/* Stats Overview */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card>
          <div className="text-sm text-slate-600">Total Users</div>
          <div className="text-3xl font-bold text-teal-700 mt-1">
            {stats.users.total.toLocaleString()}
          </div>
          <div className="text-xs text-slate-500 mt-2">
            Total Coins: {formatCoinsValue(stats.users.total_coins)}
          </div>
        </Card>

        <Card>
          <div className="text-sm text-slate-600">Total Campaigns</div>
          <div className="text-3xl font-bold text-blue-700 mt-1">
            {stats.campaigns.total.toLocaleString()}
          </div>
          <div className="text-xs text-slate-500 mt-2">
            Active: {stats.campaigns.active} | Visits: {stats.campaigns.total_visits}
          </div>
        </Card>

        <Card>
          <div className="text-sm text-slate-600">Enforcement (24h)</div>
          <div className="mt-2 space-y-1">
            {stats.enforcement.map((item) => (
              <div key={item.outcome} className="flex justify-between text-sm">
                <span className="text-slate-600">{item.outcome}:</span>
                <span className="font-medium">{item.count}</span>
              </div>
            ))}
          </div>
        </Card>
      </div>

      {/* Top Earners */}
      <Card>
        <h2 className="text-xl font-semibold mb-4">Top Earners (Last 7 Days)</h2>
        {stats.top_earners.length === 0 ? (
          <p className="text-slate-600">No data available</p>
        ) : (
          <div className="space-y-2">
            {stats.top_earners.map((earner, index) => (
              <div
                key={earner.username}
                className="flex items-center justify-between p-3 bg-slate-50 rounded"
              >
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 rounded-full bg-teal-600 text-white flex items-center justify-center font-bold">
                    {index + 1}
                  </div>
                  <span className="font-medium">{earner.username}</span>
                </div>
                <span className="text-teal-700 font-semibold">
                  +{formatCoinsValue(earner.total_earned)}
                </span>
              </div>
            ))}
          </div>
        )}
      </Card>

      {/* Quick Actions */}
      <Card>
        <h2 className="text-xl font-semibold mb-4">Quick Actions</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
          <Link
            to="/admin/users"
            className="p-4 border border-slate-300 rounded hover:bg-slate-50 transition"
          >
            <div className="font-medium">User Management</div>
            <div className="text-sm text-slate-600 mt-1">
              View, search, and manage user accounts
            </div>
          </Link>

          <Link
            to="/admin/limits"
            className="p-4 border border-slate-300 rounded hover:bg-slate-50 transition"
          >
            <div className="font-medium">Campaign Limits</div>
            <div className="text-sm text-slate-600 mt-1">
              Configure daily limits and cooldown periods
            </div>
          </Link>

          <Link
            to="/admin/campaigns"
            className="p-4 border border-slate-300 rounded hover:bg-slate-50 transition"
          >
            <div className="font-medium">Campaign Overview</div>
            <div className="text-sm text-slate-600 mt-1">
              Monitor all campaigns and their performance
            </div>
          </Link>

          <Link
            to="/admin/logs"
            className="p-4 border border-slate-300 rounded hover:bg-slate-50 transition"
          >
            <div className="font-medium">Enforcement Logs</div>
            <div className="text-sm text-slate-600 mt-1">
              Review limit enforcement and user activity
            </div>
          </Link>
        </div>
      </Card>
    </div>
  );
}

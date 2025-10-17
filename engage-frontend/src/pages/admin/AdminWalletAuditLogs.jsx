import { useState, useEffect } from 'react';
import Card from '../../components/ui/Card';
import { API_BASE } from '../../lib/api';

export default function AdminWalletAuditLogs() {
  const [logs, setLogs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [filters, setFilters] = useState({
    userId: '',
    actorType: '',
    action: '',
    startDate: '',
    endDate: '',
  });
  const [pagination, setPagination] = useState({
    total: 0,
    limit: 50,
    offset: 0,
    hasMore: false,
  });

  useEffect(() => {
    fetchAuditLogs();
  }, [pagination.offset]);

  const fetchAuditLogs = async () => {
    try {
      setLoading(true);
      setError(null);

      const token = localStorage.getItem('engage_swap_token');

      // Build query params
      const params = new URLSearchParams();
      params.append('limit', pagination.limit);
      params.append('offset', pagination.offset);

      // Apply filters
      if (filters.userId) params.append('userId', filters.userId);
      if (filters.actorType) params.append('actorType', filters.actorType);
      if (filters.action) params.append('action', filters.action);
      if (filters.startDate) params.append('startDate', filters.startDate);
      if (filters.endDate) params.append('endDate', filters.endDate);

      const response = await fetch(`${API_BASE}/admin/wallet/audit-logs?${params.toString()}`, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
      });

      if (!response.ok) {
        throw new Error('Failed to fetch audit logs');
      }

      const data = await response.json();
      setLogs(data.logs || []);
      setPagination((prev) => ({
        ...prev,
        total: data.pagination?.total || 0,
        hasMore: data.pagination?.hasMore || false,
      }));
    } catch (err) {
      console.error('Error fetching audit logs:', err);
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleFilterChange = (key, value) => {
    setFilters((prev) => ({ ...prev, [key]: value }));
  };

  const applyFilters = () => {
    setPagination((prev) => ({ ...prev, offset: 0 }));
    fetchAuditLogs();
  };

  const clearFilters = () => {
    setFilters({
      userId: '',
      actorType: '',
      action: '',
      startDate: '',
      endDate: '',
    });
    setPagination((prev) => ({ ...prev, offset: 0 }));
    setTimeout(() => fetchAuditLogs(), 0);
  };

  const handlePrevPage = () => {
    setPagination((prev) => ({
      ...prev,
      offset: Math.max(0, prev.offset - prev.limit),
    }));
  };

  const handleNextPage = () => {
    setPagination((prev) => ({
      ...prev,
      offset: prev.offset + prev.limit,
    }));
  };

  const formatDate = (dateString) => {
    const date = new Date(dateString);
    return date.toLocaleString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit',
    });
  };

  const formatAmount = (amount) => {
    if (!amount) return '-';
    const num = parseFloat(amount);
    return num.toFixed(3);
  };

  return (
    <div className="container mx-auto px-4 py-8">
      <h1 className="text-3xl font-bold mb-6">Wallet Audit Logs</h1>

      {/* Filters */}
      <Card className="p-4 mb-6">
        <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-5 gap-4">
          <input
            type="number"
            placeholder="User ID"
            value={filters.userId}
            onChange={(e) => handleFilterChange('userId', e.target.value)}
            className="px-3 py-2 border rounded-md"
          />
          <select
            value={filters.actorType}
            onChange={(e) => handleFilterChange('actorType', e.target.value)}
            className="px-3 py-2 border rounded-md"
          >
            <option value="">All Actor Types</option>
            <option value="SYSTEM">System</option>
            <option value="ADMIN">Admin</option>
          </select>
          <select
            value={filters.action}
            onChange={(e) => handleFilterChange('action', e.target.value)}
            className="px-3 py-2 border rounded-md"
          >
            <option value="">All Actions</option>
            <option value="CREATE_TXN">Create Transaction</option>
            <option value="REVERSE_TXN">Reverse Transaction</option>
            <option value="ADJUST_BALANCE">Adjust Balance</option>
            <option value="RECALC_AGGREGATES">Recalculate Aggregates</option>
            <option value="CREATE_WALLET">Create Wallet</option>
            <option value="LOCK_FUNDS">Lock Funds</option>
            <option value="UNLOCK_FUNDS">Unlock Funds</option>
          </select>
          <input
            type="date"
            placeholder="Start Date"
            value={filters.startDate}
            onChange={(e) => handleFilterChange('startDate', e.target.value)}
            className="px-3 py-2 border rounded-md"
          />
          <input
            type="date"
            placeholder="End Date"
            value={filters.endDate}
            onChange={(e) => handleFilterChange('endDate', e.target.value)}
            className="px-3 py-2 border rounded-md"
          />
        </div>
        <div className="flex space-x-2 mt-3">
          <button
            onClick={applyFilters}
            className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700"
          >
            Apply Filters
          </button>
          <button
            onClick={clearFilters}
            className="px-4 py-2 bg-gray-200 text-gray-700 rounded-md hover:bg-gray-300"
          >
            Clear
          </button>
        </div>
      </Card>

      {/* Loading State */}
      {loading && (
        <div className="text-center py-8">
          <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
          <p className="mt-2 text-gray-600">Loading audit logs...</p>
        </div>
      )}

      {/* Error State */}
      {error && !loading && (
        <Card className="p-4 bg-red-50 text-red-600">
          <p>Error: {error}</p>
          <button
            onClick={fetchAuditLogs}
            className="mt-2 px-4 py-2 bg-red-600 text-white rounded-md hover:bg-red-700"
          >
            Retry
          </button>
        </Card>
      )}

      {/* Empty State */}
      {!loading && !error && logs.length === 0 && (
        <Card className="p-8 text-center text-gray-500">
          <p className="text-lg">No audit logs found</p>
        </Card>
      )}

      {/* Logs Table */}
      {!loading && !error && logs.length > 0 && (
        <Card className="overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gray-50 border-b">
                <tr>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">ID</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Date & Time</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Actor</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">User</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Action</th>
                  <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 uppercase">Amount</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Reason</th>
                </tr>
              </thead>
              <tbody className="divide-y">
                {logs.map((log) => (
                  <tr key={log.id} className="hover:bg-gray-50">
                    <td className="px-4 py-3 text-sm text-gray-500">{log.id}</td>
                    <td className="px-4 py-3 text-sm text-gray-900">{formatDate(log.created_at)}</td>
                    <td className="px-4 py-3 text-sm">
                      <span className={`px-2 py-1 rounded text-xs font-medium ${log.actor_type === 'SYSTEM' ? 'bg-blue-100 text-blue-800' : 'bg-purple-100 text-purple-800'}`}>
                        {log.actor_type}
                      </span>
                      {log.actor_username && (
                        <span className="ml-2 text-gray-600">({log.actor_username})</span>
                      )}
                    </td>
                    <td className="px-4 py-3 text-sm">
                      <div>
                        <span className="font-medium">{log.user_username || `User ${log.user_id}`}</span>
                        <span className="text-gray-500 text-xs ml-1">#{log.user_id}</span>
                      </div>
                    </td>
                    <td className="px-4 py-3 text-sm">
                      <span className="font-mono text-xs bg-gray-100 px-2 py-1 rounded">
                        {log.action}
                      </span>
                      {log.txn_id && (
                        <span className="ml-2 text-xs text-gray-500">TXN#{log.txn_id}</span>
                      )}
                    </td>
                    <td className="px-4 py-3 text-sm text-right font-mono">
                      {formatAmount(log.amount)}
                    </td>
                    <td className="px-4 py-3 text-sm text-gray-600 max-w-xs truncate">
                      {log.reason || '-'}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* Pagination */}
          <div className="flex items-center justify-between px-4 py-3 bg-gray-50 border-t">
            <div className="text-sm text-gray-600">
              Showing {pagination.offset + 1} to {Math.min(pagination.offset + pagination.limit, pagination.total)} of {pagination.total} logs
            </div>
            <div className="flex space-x-2">
              <button
                onClick={handlePrevPage}
                disabled={pagination.offset === 0}
                className="px-4 py-2 bg-white border rounded-md hover:bg-gray-100 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                Previous
              </button>
              <button
                onClick={handleNextPage}
                disabled={!pagination.hasMore}
                className="px-4 py-2 bg-white border rounded-md hover:bg-gray-100 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                Next
              </button>
            </div>
          </div>
        </Card>
      )}
    </div>
  );
}

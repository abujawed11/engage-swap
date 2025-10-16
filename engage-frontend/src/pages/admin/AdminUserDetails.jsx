import { useState, useEffect } from 'react';
import { Link, useParams } from 'react-router-dom';
import Card from '../../components/ui/Card';
import Button from '../../components/ui/Button';
import { adminAPI } from '../../lib/adminApi';
import { formatCoinsValue } from '../../lib/coins';

export default function AdminUserDetails() {
  const { id } = useParams();
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  const [showAdjustModal, setShowAdjustModal] = useState(false);
  const [adjustAmount, setAdjustAmount] = useState('');
  const [adjustReason, setAdjustReason] = useState('');
  const [adjusting, setAdjusting] = useState(false);

  const [showDisableModal, setShowDisableModal] = useState(false);
  const [disableReason, setDisableReason] = useState('');
  const [disabling, setDisabling] = useState(false);

  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [deleting, setDeleting] = useState(false);

  useEffect(() => {
    fetchUserDetails();
  }, [id]);

  const fetchUserDetails = async () => {
    try {
      setLoading(true);
      const userData = await adminAPI.getUserDetails(id);
      setData(userData);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleAdjustCoins = async () => {
    if (!adjustAmount || !adjustReason) {
      setError('Amount and reason are required');
      return;
    }

    const amount = parseFloat(adjustAmount);
    if (isNaN(amount) || amount === 0) {
      setError('Invalid amount');
      return;
    }

    try {
      setAdjusting(true);
      setError('');
      await adminAPI.adjustUserCoins(id, amount, adjustReason);
      setSuccess(`Coins adjusted by ${amount > 0 ? '+' : ''}${amount}`);
      setShowAdjustModal(false);
      setAdjustAmount('');
      setAdjustReason('');
      fetchUserDetails();
      setTimeout(() => setSuccess(''), 3000);
    } catch (err) {
      setError(err.message);
    } finally {
      setAdjusting(false);
    }
  };

  const handleDisableUser = async () => {
    if (!disableReason) {
      setError('Reason is required');
      return;
    }

    try {
      setDisabling(true);
      setError('');
      await adminAPI.disableUser(id, disableReason);
      setSuccess('User disabled successfully');
      setShowDisableModal(false);
      setDisableReason('');
      fetchUserDetails();
      setTimeout(() => setSuccess(''), 3000);
    } catch (err) {
      setError(err.message);
    } finally {
      setDisabling(false);
    }
  };

  const handleEnableUser = async () => {
    try {
      setError('');
      await adminAPI.enableUser(id);
      setSuccess('User enabled successfully');
      fetchUserDetails();
      setTimeout(() => setSuccess(''), 3000);
    } catch (err) {
      setError(err.message);
    }
  };

  const handleDeleteUser = async () => {
    try {
      setDeleting(true);
      setError('');
      await adminAPI.deleteUser(id);
      setSuccess('User deleted successfully');
      setTimeout(() => {
        navigate('/admin/users');
      }, 1500);
    } catch (err) {
      setError(err.message);
      setDeleting(false);
    }
  };

  if (loading) {
    return (
      <div className="space-y-6">
        <h1 className="text-3xl font-bold">User Details</h1>
        <Card>
          <p className="text-slate-600">Loading...</p>
        </Card>
      </div>
    );
  }

  if (error && !data) {
    return (
      <div className="space-y-6">
        <h1 className="text-3xl font-bold">User Details</h1>
        <Card>
          <p className="text-red-600">{error}</p>
        </Card>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-3xl font-bold">User Details</h1>
        <Link
          to="/admin/users"
          className="px-4 py-2 bg-slate-600 text-white rounded hover:bg-slate-700 transition"
        >
          ← Back to Users
        </Link>
      </div>

      {success && (
        <Card>
          <div className="text-sm text-green-700 bg-green-50 border border-green-200 rounded px-3 py-2">
            {success}
          </div>
        </Card>
      )}

      {error && (
        <Card>
          <div className="text-sm text-red-700 bg-red-50 border border-red-200 rounded px-3 py-2">
            {error}
          </div>
        </Card>
      )}

      {/* User Info */}
      <Card>
        <div className="flex items-start justify-between">
          <div className="flex-1">
            <div className="flex items-center gap-3">
              <h2 className="text-2xl font-semibold">{data.user.username}</h2>
              {data.user.is_disabled && (
                <span className="text-xs bg-red-100 text-red-800 px-3 py-1 rounded font-medium">
                  DISABLED
                </span>
              )}
            </div>
            <p className="text-slate-600 mt-1">{data.user.email}</p>
            <p className="text-xs text-slate-500 mt-1">{data.user.public_id}</p>

            {data.user.is_disabled && data.user.disabled_reason && (
              <div className="mt-3 p-3 bg-red-50 border border-red-200 rounded">
                <div className="text-sm font-medium text-red-800">Disabled Reason:</div>
                <div className="text-sm text-red-700 mt-1">{data.user.disabled_reason}</div>
                {data.user.disabled_at && (
                  <div className="text-xs text-red-600 mt-1">
                    Disabled on: {new Date(data.user.disabled_at).toLocaleString()}
                  </div>
                )}
              </div>
            )}
          </div>
          <div className="text-right">
            <div className="text-sm text-slate-600">Balance</div>
            <div className="text-3xl font-bold text-teal-700">
              {formatCoinsValue(data.user.coins)}
            </div>
            <div className="flex flex-col gap-2 mt-3">
              <Button
                onClick={() => setShowAdjustModal(true)}
                className="text-sm bg-orange-600 hover:bg-orange-700"
              >
                Adjust Coins
              </Button>
              {data.user.is_disabled ? (
                <Button
                  onClick={handleEnableUser}
                  className="text-sm bg-green-600 hover:bg-green-700"
                >
                  Enable Account
                </Button>
              ) : (
                <Button
                  onClick={() => setShowDisableModal(true)}
                  className="text-sm bg-yellow-600 hover:bg-yellow-700"
                >
                  Disable Account
                </Button>
              )}
              <Button
                onClick={() => setShowDeleteModal(true)}
                className="text-sm bg-red-600 hover:bg-red-700"
              >
                Delete User
              </Button>
            </div>
          </div>
        </div>

        <div className="mt-4 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 pt-4 border-t border-slate-300">
          <div>
            <div className="text-sm text-slate-600">Status</div>
            <div className="font-medium mt-1">
              {data.user.email_verified_at ? (
                <span className="text-green-700">✓ Verified</span>
              ) : (
                <span className="text-yellow-700">Pending Verification</span>
              )}
            </div>
          </div>
          <div>
            <div className="text-sm text-slate-600">Member Since</div>
            <div className="font-medium mt-1">
              {new Date(data.user.created_at).toLocaleDateString()}
            </div>
          </div>
          <div>
            <div className="text-sm text-slate-600">Last Updated</div>
            <div className="font-medium mt-1">
              {data.user.updated_at ? new Date(data.user.updated_at).toLocaleDateString() : 'N/A'}
            </div>
          </div>
          <div>
            <div className="text-sm text-slate-600">Admin</div>
            <div className="font-medium mt-1">
              {data.user.is_admin ? 'Yes' : 'No'}
            </div>
          </div>
        </div>

        <div className="mt-4 pt-4 border-t border-slate-300">
          <div className="text-sm text-slate-600">IP Address</div>
          <div className="font-mono text-sm mt-1">
            {data.user.ip_address || 'Not available'}
          </div>
        </div>
      </Card>

      {/* Campaigns */}
      <Card>
        <h2 className="text-xl font-semibold mb-4">
          Campaigns ({data.campaigns.length})
        </h2>
        {data.campaigns.length === 0 ? (
          <p className="text-slate-600">No campaigns created</p>
        ) : (
          <div className="space-y-2">
            {data.campaigns.map((campaign) => (
              <div
                key={campaign.id}
                className="p-3 border border-slate-300 rounded flex items-center justify-between"
              >
                <div>
                  <div className="font-medium">{campaign.title}</div>
                  <div className="text-sm text-slate-600">
                    {formatCoinsValue(campaign.coins_per_visit)} per visit •{' '}
                    {campaign.clicks_served}/{campaign.total_clicks} completed
                  </div>
                </div>
                <div className="flex gap-2">
                  {campaign.is_finished && (
                    <span className="text-xs bg-slate-200 text-slate-700 px-2 py-1 rounded">
                      Finished
                    </span>
                  )}
                  {campaign.is_paused && (
                    <span className="text-xs bg-yellow-200 text-yellow-800 px-2 py-1 rounded">
                      Paused
                    </span>
                  )}
                  {!campaign.is_finished && !campaign.is_paused && (
                    <span className="text-xs bg-green-200 text-green-800 px-2 py-1 rounded">
                      Active
                    </span>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </Card>

      {/* Recent Visits */}
      <Card>
        <h2 className="text-xl font-semibold mb-4">
          Recent Visits ({data.visits.length})
        </h2>
        {data.visits.length === 0 ? (
          <p className="text-slate-600">No visits yet</p>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-slate-100 border-b border-slate-300">
                <tr>
                  <th className="text-left px-4 py-2 text-sm">Campaign</th>
                  <th className="text-right px-4 py-2 text-sm">Earned</th>
                  <th className="text-left px-4 py-2 text-sm">Type</th>
                  <th className="text-left px-4 py-2 text-sm">Date</th>
                </tr>
              </thead>
              <tbody>
                {data.visits.map((visit) => (
                  <tr key={visit.id} className="border-b border-slate-200">
                    <td className="px-4 py-2 text-sm">{visit.campaign_title || 'N/A'}</td>
                    <td className="px-4 py-2 text-sm text-right font-medium text-teal-700">
                      +{formatCoinsValue(visit.coins_earned)}
                    </td>
                    <td className="px-4 py-2 text-sm">
                      {visit.is_consolation ? (
                        <span className="text-xs bg-blue-100 text-blue-800 px-2 py-1 rounded">
                          Consolation
                        </span>
                      ) : (
                        <span className="text-xs bg-green-100 text-green-800 px-2 py-1 rounded">
                          Regular
                        </span>
                      )}
                    </td>
                    <td className="px-4 py-2 text-sm text-slate-600">
                      {new Date(visit.visited_at).toLocaleString()}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </Card>

      {/* Enforcement Logs */}
      <Card>
        <h2 className="text-xl font-semibold mb-4">
          Enforcement Logs ({data.enforcement_logs.length})
        </h2>
        {data.enforcement_logs.length === 0 ? (
          <p className="text-slate-600">No enforcement logs</p>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-slate-100 border-b border-slate-300">
                <tr>
                  <th className="text-left px-4 py-2 text-sm">Campaign</th>
                  <th className="text-left px-4 py-2 text-sm">Outcome</th>
                  <th className="text-left px-4 py-2 text-sm">Tier</th>
                  <th className="text-left px-4 py-2 text-sm">Date</th>
                </tr>
              </thead>
              <tbody>
                {data.enforcement_logs.map((log) => (
                  <tr key={log.id} className="border-b border-slate-200">
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
                    <td className="px-4 py-2 text-sm">{log.value_tier}</td>
                    <td className="px-4 py-2 text-sm text-slate-600">
                      {new Date(log.created_at).toLocaleString()}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </Card>

      {/* Adjust Coins Modal */}
      {showAdjustModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 max-w-md w-full mx-4">
            <h3 className="text-xl font-semibold mb-4">Adjust User Coins</h3>

            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium mb-1">
                  Amount (use + or - for add/subtract)
                </label>
                <input
                  type="number"
                  step="0.001"
                  value={adjustAmount}
                  onChange={(e) => setAdjustAmount(e.target.value)}
                  placeholder="e.g., +10 or -5"
                  className="w-full px-3 py-2 border border-slate-300 rounded"
                />
              </div>

              <div>
                <label className="block text-sm font-medium mb-1">Reason</label>
                <textarea
                  value={adjustReason}
                  onChange={(e) => setAdjustReason(e.target.value)}
                  placeholder="Explain why you're adjusting this user's balance..."
                  className="w-full px-3 py-2 border border-slate-300 rounded"
                  rows="3"
                />
              </div>

              <div className="flex gap-2 pt-2">
                <Button onClick={handleAdjustCoins} disabled={adjusting}>
                  {adjusting ? 'Adjusting...' : 'Confirm Adjustment'}
                </Button>
                <Button
                  onClick={() => {
                    setShowAdjustModal(false);
                    setAdjustAmount('');
                    setAdjustReason('');
                    setError('');
                  }}
                  className="bg-slate-500 hover:bg-slate-600"
                >
                  Cancel
                </Button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Disable User Modal */}
      {showDisableModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 max-w-md w-full mx-4">
            <h3 className="text-xl font-semibold mb-4">Disable User Account</h3>
            <p className="text-sm text-slate-600 mb-4">
              This user will not be able to login, earn coins, or create campaigns until re-enabled.
            </p>

            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium mb-1">Reason for Disabling</label>
                <textarea
                  value={disableReason}
                  onChange={(e) => setDisableReason(e.target.value)}
                  placeholder="Explain why you're disabling this account..."
                  className="w-full px-3 py-2 border border-slate-300 rounded"
                  rows="3"
                />
              </div>

              <div className="flex gap-2 pt-2">
                <Button
                  onClick={handleDisableUser}
                  disabled={disabling}
                  className="bg-yellow-600 hover:bg-yellow-700"
                >
                  {disabling ? 'Disabling...' : 'Disable Account'}
                </Button>
                <Button
                  onClick={() => {
                    setShowDisableModal(false);
                    setDisableReason('');
                    setError('');
                  }}
                  className="bg-slate-500 hover:bg-slate-600"
                >
                  Cancel
                </Button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Delete User Modal */}
      {showDeleteModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 max-w-md w-full mx-4">
            <h3 className="text-xl font-semibold mb-4 text-red-700">Delete User Account</h3>
            <div className="space-y-3">
              <p className="text-sm text-slate-700">
                <strong>Warning:</strong> This action is permanent and cannot be undone!
              </p>
              <p className="text-sm text-slate-600">
                The user account, all their campaigns, visits, and related data will be permanently deleted.
              </p>

              <div className="bg-red-50 border border-red-200 rounded p-3 my-3">
                <p className="text-sm font-medium text-red-800">
                  User: <strong>{data.user.username}</strong> ({data.user.email})
                </p>
              </div>

              <div className="flex gap-2 pt-2">
                <Button
                  onClick={handleDeleteUser}
                  disabled={deleting}
                  className="bg-red-600 hover:bg-red-700"
                >
                  {deleting ? 'Deleting...' : 'Permanently Delete'}
                </Button>
                <Button
                  onClick={() => {
                    setShowDeleteModal(false);
                    setError('');
                  }}
                  className="bg-slate-500 hover:bg-slate-600"
                >
                  Cancel
                </Button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

import { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import Card from '../../components/ui/Card';
import Button from '../../components/ui/Button';
import { adminAPI } from '../../lib/adminApi';
import { formatCoinsValue } from '../../lib/coins';

export default function AdminUsers() {
  const navigate = useNavigate();
  const [users, setUsers] = useState([]);
  const [pagination, setPagination] = useState({});
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [search, setSearch] = useState('');
  const [page, setPage] = useState(1);

  useEffect(() => {
    fetchUsers();
  }, [page, search]);

  const fetchUsers = async () => {
    try {
      setLoading(true);
      const data = await adminAPI.getUsers({ page, search, limit: 20 });
      setUsers(data.users);
      setPagination(data.pagination);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleSearch = (e) => {
    e.preventDefault();
    setPage(1); // Reset to page 1 on new search
    fetchUsers();
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-3xl font-bold">User Management</h1>
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

      {/* Search */}
      <Card>
        <form onSubmit={handleSearch} className="flex gap-2">
          <input
            type="text"
            placeholder="Search by username or email..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="flex-1 px-3 py-2 border border-slate-300 rounded"
          />
          <Button type="submit">Search</Button>
          {search && (
            <Button
              type="button"
              onClick={() => {
                setSearch('');
                setPage(1);
              }}
              className="bg-slate-500 hover:bg-slate-600"
            >
              Clear
            </Button>
          )}
        </form>
      </Card>

      {/* Users Table */}
      <Card>
        <div className="mb-4 flex items-center justify-between">
          <h2 className="text-xl font-semibold">
            Users ({pagination.total?.toLocaleString() || 0})
          </h2>
          {pagination.total_pages > 1 && (
            <div className="text-sm text-slate-600">
              Page {pagination.page} of {pagination.total_pages}
            </div>
          )}
        </div>

        {loading ? (
          <p className="text-slate-600">Loading...</p>
        ) : users.length === 0 ? (
          <p className="text-slate-600">No users found</p>
        ) : (
          <>
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-slate-100 border-b border-slate-300">
                  <tr>
                    <th className="text-left px-4 py-3 text-sm font-semibold">Username</th>
                    <th className="text-left px-4 py-3 text-sm font-semibold">Email</th>
                    <th className="text-right px-4 py-3 text-sm font-semibold">Coins</th>
                    <th className="text-left px-4 py-3 text-sm font-semibold">Verified</th>
                    <th className="text-left px-4 py-3 text-sm font-semibold">Joined</th>
                    <th className="text-right px-4 py-3 text-sm font-semibold">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {users.map((user) => (
                    <tr key={user.id} className="border-b border-slate-200 hover:bg-slate-50">
                      <td className="px-4 py-3">
                        <div className="font-medium">{user.username}</div>
                        <div className="text-xs text-slate-500">{user.public_id}</div>
                      </td>
                      <td className="px-4 py-3 text-sm">{user.email}</td>
                      <td className="px-4 py-3 text-right font-medium text-teal-700">
                        {formatCoinsValue(user.coins)}
                      </td>
                      <td className="px-4 py-3">
                        {user.email_verified_at ? (
                          <span className="text-xs bg-green-100 text-green-800 px-2 py-1 rounded">
                            ✓ Verified
                          </span>
                        ) : (
                          <span className="text-xs bg-yellow-100 text-yellow-800 px-2 py-1 rounded">
                            Pending
                          </span>
                        )}
                      </td>
                      <td className="px-4 py-3 text-sm text-slate-600">
                        {new Date(user.created_at).toLocaleDateString()}
                      </td>
                      <td className="px-4 py-3 text-right">
                        <Button
                          onClick={() => navigate(`/admin/users/${user.id}`)}
                          className="text-sm bg-blue-600 hover:bg-blue-700"
                        >
                          View Details
                        </Button>
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

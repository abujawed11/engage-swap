// src/pages/admin/AdminCoinPacks.jsx
import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { apiRequest } from '../../lib/api';
import Card from '../../components/ui/Card';

export default function AdminCoinPacks() {
  const [packs, setPacks] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [editingPack, setEditingPack] = useState(null);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    fetchPacks();
  }, []);

  const fetchPacks = async () => {
    try {
      setLoading(true);
      setError(null);

      const data = await apiRequest('/admin/coin-packs');
      setPacks(data.packs || []);
    } catch (err) {
      console.error('Error fetching packs:', err);
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleEdit = (pack) => {
    setEditingPack({
      id: pack.id,
      tier_name: pack.tier_name,
      base_coins: parseFloat(pack.base_coins),
      bonus_percent: parseFloat(pack.bonus_percent),
      price_inr: parseFloat(pack.price_inr),
      price_usd: parseFloat(pack.price_usd),
      is_featured: Boolean(pack.is_featured),
      is_popular: Boolean(pack.is_popular),
      is_active: Boolean(pack.is_active),
      display_order: pack.display_order,
      badge_text: pack.badge_text || '',
      description: pack.description || '',
    });
  };

  const handleCancelEdit = () => {
    setEditingPack(null);
  };

  const handleSave = async () => {
    try {
      setSaving(true);
      setError(null);

      await apiRequest(`/admin/coin-packs/${editingPack.id}`, {
        method: 'PUT',
        body: JSON.stringify(editingPack),
      });

      await fetchPacks();
      setEditingPack(null);
    } catch (err) {
      console.error('Error saving pack:', err);
      setError(err.message);
    } finally {
      setSaving(false);
    }
  };

  const handleInputChange = (field, value) => {
    setEditingPack((prev) => ({
      ...prev,
      [field]: value,
    }));
  };

  if (loading) {
    return (
      <div className="max-w-6xl mx-auto">
        <Card className="p-8 text-center">
          <div className="inline-block animate-spin rounded-full h-12 w-12 border-b-2 border-teal-600"></div>
          <p className="mt-4 text-slate-600">Loading coin packs...</p>
        </Card>
      </div>
    );
  }

  return (
    <div className="max-w-6xl mx-auto space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Manage Coin Packs</h1>
          <p className="text-slate-700 mt-1">
            Edit pricing, coin amounts, and bonuses for the marketplace
          </p>
        </div>
        <Link
          to="/admin"
          className="px-4 py-2 bg-slate-600 text-white rounded hover:bg-slate-700 transition"
        >
          ← Back to Dashboard
        </Link>
      </div>

      {error && (
        <Card className="p-4 bg-red-50 border border-red-200">
          <p className="text-red-800 font-semibold">Error: {error}</p>
        </Card>
      )}

      <div className="space-y-4">
        {packs.map((pack) => {
          const isEditing = editingPack?.id === pack.id;
          const baseCoins = isEditing ? editingPack.base_coins : parseFloat(pack.base_coins);
          const bonusPercent = isEditing ? editingPack.bonus_percent : parseFloat(pack.bonus_percent);
          const totalCoins = baseCoins * (1 + bonusPercent / 100);

          return (
            <Card
              key={pack.id}
              className={`p-6 ${isEditing ? 'border-2 border-yellow-400 bg-yellow-50' : 'border border-slate-200'}`}
            >
              {isEditing ? (
                // Edit Mode
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <h3 className="text-xl font-bold text-slate-900">
                      Editing: {editingPack.tier_name}
                    </h3>
                    <div className="flex gap-2">
                      <button
                        onClick={handleCancelEdit}
                        disabled={saving}
                        className="px-4 py-2 bg-slate-200 hover:bg-slate-300 text-slate-800 rounded-md font-medium disabled:opacity-50"
                      >
                        Cancel
                      </button>
                      <button
                        onClick={handleSave}
                        disabled={saving}
                        className="px-4 py-2 bg-teal-600 hover:bg-teal-700 text-white rounded-md font-medium disabled:opacity-50"
                      >
                        {saving ? 'Saving...' : 'Save Changes'}
                      </button>
                    </div>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {/* Tier Name */}
                    <div>
                      <label className="block text-sm font-medium text-slate-700 mb-1">
                        Tier Name
                      </label>
                      <input
                        type="text"
                        value={editingPack.tier_name}
                        onChange={(e) => handleInputChange('tier_name', e.target.value)}
                        className="w-full px-3 py-2 border border-slate-300 rounded-md focus:ring-2 focus:ring-teal-600"
                      />
                    </div>

                    {/* Base Coins */}
                    <div>
                      <label className="block text-sm font-medium text-slate-700 mb-1">
                        Base Coins
                      </label>
                      <input
                        type="number"
                        step="0.001"
                        value={editingPack.base_coins}
                        onChange={(e) => handleInputChange('base_coins', parseFloat(e.target.value))}
                        className="w-full px-3 py-2 border border-slate-300 rounded-md focus:ring-2 focus:ring-teal-600"
                      />
                    </div>

                    {/* Bonus Percent */}
                    <div>
                      <label className="block text-sm font-medium text-slate-700 mb-1">
                        Bonus Percent (%)
                      </label>
                      <input
                        type="number"
                        step="0.01"
                        min="0"
                        max="100"
                        value={editingPack.bonus_percent}
                        onChange={(e) => handleInputChange('bonus_percent', parseFloat(e.target.value))}
                        className="w-full px-3 py-2 border border-slate-300 rounded-md focus:ring-2 focus:ring-teal-600"
                      />
                    </div>

                    {/* Total Coins (calculated) */}
                    <div>
                      <label className="block text-sm font-medium text-slate-700 mb-1">
                        Total Coins (calculated)
                      </label>
                      <input
                        type="text"
                        value={totalCoins.toFixed(3)}
                        disabled
                        className="w-full px-3 py-2 border border-slate-300 rounded-md bg-slate-100 text-slate-600"
                      />
                    </div>

                    {/* Price INR */}
                    <div>
                      <label className="block text-sm font-medium text-slate-700 mb-1">
                        Price INR (₹)
                      </label>
                      <input
                        type="number"
                        step="0.01"
                        value={editingPack.price_inr}
                        onChange={(e) => handleInputChange('price_inr', parseFloat(e.target.value))}
                        className="w-full px-3 py-2 border border-slate-300 rounded-md focus:ring-2 focus:ring-teal-600"
                      />
                    </div>

                    {/* Price USD */}
                    <div>
                      <label className="block text-sm font-medium text-slate-700 mb-1">
                        Price USD ($)
                      </label>
                      <input
                        type="number"
                        step="0.01"
                        value={editingPack.price_usd}
                        onChange={(e) => handleInputChange('price_usd', parseFloat(e.target.value))}
                        className="w-full px-3 py-2 border border-slate-300 rounded-md focus:ring-2 focus:ring-teal-600"
                      />
                    </div>

                    {/* Display Order */}
                    <div>
                      <label className="block text-sm font-medium text-slate-700 mb-1">
                        Display Order
                      </label>
                      <input
                        type="number"
                        value={editingPack.display_order}
                        onChange={(e) => handleInputChange('display_order', parseInt(e.target.value))}
                        className="w-full px-3 py-2 border border-slate-300 rounded-md focus:ring-2 focus:ring-teal-600"
                      />
                    </div>

                    {/* Badge Text */}
                    <div>
                      <label className="block text-sm font-medium text-slate-700 mb-1">
                        Badge Text (optional)
                      </label>
                      <input
                        type="text"
                        value={editingPack.badge_text}
                        onChange={(e) => handleInputChange('badge_text', e.target.value)}
                        placeholder="e.g., Best Value, Most Popular"
                        className="w-full px-3 py-2 border border-slate-300 rounded-md focus:ring-2 focus:ring-teal-600"
                      />
                    </div>
                  </div>

                  {/* Description */}
                  <div>
                    <label className="block text-sm font-medium text-slate-700 mb-1">
                      Description (optional)
                    </label>
                    <textarea
                      value={editingPack.description}
                      onChange={(e) => handleInputChange('description', e.target.value)}
                      rows={2}
                      className="w-full px-3 py-2 border border-slate-300 rounded-md focus:ring-2 focus:ring-teal-600"
                    />
                  </div>

                  {/* Checkboxes */}
                  <div className="flex gap-6">
                    <label className="flex items-center gap-2">
                      <input
                        type="checkbox"
                        checked={editingPack.is_active}
                        onChange={(e) => handleInputChange('is_active', e.target.checked)}
                        className="w-4 h-4 text-teal-600 focus:ring-teal-600"
                      />
                      <span className="text-sm font-medium text-slate-700">Active</span>
                    </label>
                    <label className="flex items-center gap-2">
                      <input
                        type="checkbox"
                        checked={editingPack.is_featured}
                        onChange={(e) => handleInputChange('is_featured', e.target.checked)}
                        className="w-4 h-4 text-teal-600 focus:ring-teal-600"
                      />
                      <span className="text-sm font-medium text-slate-700">Featured</span>
                    </label>
                    <label className="flex items-center gap-2">
                      <input
                        type="checkbox"
                        checked={editingPack.is_popular}
                        onChange={(e) => handleInputChange('is_popular', e.target.checked)}
                        className="w-4 h-4 text-teal-600 focus:ring-teal-600"
                      />
                      <span className="text-sm font-medium text-slate-700">Popular</span>
                    </label>
                  </div>
                </div>
              ) : (
                // View Mode
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <h3 className="text-xl font-bold text-slate-900">{pack.tier_name}</h3>
                      {pack.badge_text && (
                        <span className="text-xs font-bold px-2 py-1 rounded bg-yellow-400 text-slate-900">
                          {pack.badge_text}
                        </span>
                      )}
                      {!pack.is_active && (
                        <span className="text-xs font-bold px-2 py-1 rounded bg-red-100 text-red-700">
                          INACTIVE
                        </span>
                      )}
                    </div>
                    <button
                      onClick={() => handleEdit(pack)}
                      className="px-4 py-2 bg-teal-600 hover:bg-teal-700 text-white rounded-md font-medium"
                    >
                      Edit
                    </button>
                  </div>

                  <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                    <div>
                      <span className="text-slate-600">Base Coins:</span>
                      <p className="font-semibold">{parseFloat(pack.base_coins).toFixed(3)}</p>
                    </div>
                    <div>
                      <span className="text-slate-600">Bonus:</span>
                      <p className="font-semibold">{parseFloat(pack.bonus_percent).toFixed(2)}%</p>
                    </div>
                    <div>
                      <span className="text-slate-600">Total Coins:</span>
                      <p className="font-semibold text-teal-600">{totalCoins.toFixed(3)}</p>
                    </div>
                    <div>
                      <span className="text-slate-600">Display Order:</span>
                      <p className="font-semibold">{pack.display_order}</p>
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-4 text-sm">
                    <div>
                      <span className="text-slate-600">Price INR:</span>
                      <p className="font-bold text-lg">₹{parseFloat(pack.price_inr).toFixed(2)}</p>
                    </div>
                    <div>
                      <span className="text-slate-600">Price USD:</span>
                      <p className="font-bold text-lg">${parseFloat(pack.price_usd).toFixed(2)}</p>
                    </div>
                  </div>

                  {pack.description && (
                    <p className="text-sm text-slate-600 italic">{pack.description}</p>
                  )}
                </div>
              )}
            </Card>
          );
        })}
      </div>
    </div>
  );
}

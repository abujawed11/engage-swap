import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import Card from '../../components/ui/Card';
import Button from '../../components/ui/Button';
import { adminAPI } from '../../lib/adminApi';

export default function AdminLimits() {
  const [config, setConfig] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [editingKey, setEditingKey] = useState(null);
  const [editValue, setEditValue] = useState(null);

  useEffect(() => {
    fetchLimits();
  }, []);

  const fetchLimits = async () => {
    try {
      setLoading(true);
      const data = await adminAPI.getLimits();
      setConfig(data.config);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleEdit = (configItem) => {
    setEditingKey(configItem.config_key);
    setEditValue(JSON.parse(JSON.stringify(configItem.config_value)));
    setError('');
    setSuccess('');
  };

  const handleCancel = () => {
    setEditingKey(null);
    setEditValue(null);
  };

  const handleSave = async (configKey) => {
    try {
      await adminAPI.updateLimit(configKey, editValue);
      setSuccess(`Configuration '${configKey}' updated successfully!`);
      setEditingKey(null);
      setEditValue(null);
      fetchLimits();
      setTimeout(() => setSuccess(''), 3000);
    } catch (err) {
      setError(err.message);
    }
  };

  const renderEditForm = (configItem) => {
    const key = configItem.config_key;
    const value = editValue;

    if (key === 'attempt_limits') {
      return (
        <div className="space-y-3 mt-3 p-4 bg-blue-50 rounded">
          <div>
            <label className="block text-sm font-medium mb-1">
              HIGH Tier (≥10 coins) - Daily Limit
            </label>
            <input
              type="number"
              min="1"
              max="100"
              value={value.high}
              onChange={(e) =>
                setEditValue({ ...value, high: parseInt(e.target.value, 10) })
              }
              className="w-full px-3 py-2 border border-slate-300 rounded"
            />
          </div>

          <div>
            <label className="block text-sm font-medium mb-1">
              MEDIUM Tier (5-9.99 coins) - Daily Limit
            </label>
            <input
              type="number"
              min="1"
              max="100"
              value={value.medium}
              onChange={(e) =>
                setEditValue({ ...value, medium: parseInt(e.target.value, 10) })
              }
              className="w-full px-3 py-2 border border-slate-300 rounded"
            />
          </div>

          <div>
            <label className="block text-sm font-medium mb-1">
              LOW Tier (&lt;5 coins) - Daily Limit
            </label>
            <input
              type="number"
              min="1"
              max="100"
              value={value.low}
              onChange={(e) =>
                setEditValue({ ...value, low: parseInt(e.target.value, 10) })
              }
              className="w-full px-3 py-2 border border-slate-300 rounded"
            />
          </div>

          <div className="flex gap-2 pt-2">
            <Button onClick={() => handleSave(key)}>Save Changes</Button>
            <Button onClick={handleCancel} className="bg-slate-500 hover:bg-slate-600">
              Cancel
            </Button>
          </div>
        </div>
      );
    }

    if (key === 'value_thresholds') {
      return (
        <div className="space-y-3 mt-3 p-4 bg-blue-50 rounded">
          <div>
            <label className="block text-sm font-medium mb-1">
              HIGH Tier Threshold (coins_per_visit ≥)
            </label>
            <input
              type="number"
              min="1"
              step="0.001"
              value={value.high}
              onChange={(e) =>
                setEditValue({ ...value, high: parseFloat(e.target.value) })
              }
              className="w-full px-3 py-2 border border-slate-300 rounded"
            />
          </div>

          <div>
            <label className="block text-sm font-medium mb-1">
              MEDIUM Tier Threshold (coins_per_visit ≥)
            </label>
            <input
              type="number"
              min="0.001"
              step="0.001"
              value={value.medium}
              onChange={(e) =>
                setEditValue({ ...value, medium: parseFloat(e.target.value) })
              }
              className="w-full px-3 py-2 border border-slate-300 rounded"
            />
          </div>

          <div className="flex gap-2 pt-2">
            <Button onClick={() => handleSave(key)}>Save Changes</Button>
            <Button onClick={handleCancel} className="bg-slate-500 hover:bg-slate-600">
              Cancel
            </Button>
          </div>
        </div>
      );
    }

    if (key === 'cooldown_seconds') {
      return (
        <div className="space-y-3 mt-3 p-4 bg-blue-50 rounded">
          <div>
            <label className="block text-sm font-medium mb-1">
              Cooldown Duration (seconds)
            </label>
            <input
              type="number"
              min="0"
              step="60"
              value={value.value}
              onChange={(e) =>
                setEditValue({ ...value, value: parseInt(e.target.value, 10) })
              }
              className="w-full px-3 py-2 border border-slate-300 rounded"
            />
            <p className="text-xs text-slate-500 mt-1">
              {value.value / 60} minutes | {value.value / 3600} hours
            </p>
            <p className="text-xs text-slate-600 mt-2">
              Note: Cooldown only applies to campaigns with coins_per_visit ≥ 10
            </p>
          </div>

          <div className="flex gap-2 pt-2">
            <Button onClick={() => handleSave(key)}>Save Changes</Button>
            <Button onClick={handleCancel} className="bg-slate-500 hover:bg-slate-600">
              Cancel
            </Button>
          </div>
        </div>
      );
    }

    if (key === 'rotation_windows') {
      return (
        <div className="space-y-3 mt-3 p-4 bg-blue-50 rounded">
          <div>
            <label className="block text-sm font-medium mb-1">
              HIGH Tier Rotation Window (seconds)
            </label>
            <input
              type="number"
              min="60"
              step="60"
              value={value.high}
              onChange={(e) =>
                setEditValue({ ...value, high: parseInt(e.target.value, 10) })
              }
              className="w-full px-3 py-2 border border-slate-300 rounded"
            />
            <p className="text-xs text-slate-500 mt-1">{value.high / 3600} hours</p>
          </div>

          <div>
            <label className="block text-sm font-medium mb-1">
              MEDIUM Tier Rotation Window (seconds)
            </label>
            <input
              type="number"
              min="60"
              step="60"
              value={value.medium}
              onChange={(e) =>
                setEditValue({ ...value, medium: parseInt(e.target.value, 10) })
              }
              className="w-full px-3 py-2 border border-slate-300 rounded"
            />
            <p className="text-xs text-slate-500 mt-1">{value.medium / 3600} hours</p>
          </div>

          <div>
            <label className="block text-sm font-medium mb-1">
              LOW Tier Rotation Window (seconds)
            </label>
            <input
              type="number"
              min="60"
              step="60"
              value={value.low}
              onChange={(e) =>
                setEditValue({ ...value, low: parseInt(e.target.value, 10) })
              }
              className="w-full px-3 py-2 border border-slate-300 rounded"
            />
            <p className="text-xs text-slate-500 mt-1">{value.low / 3600} hours</p>
          </div>

          <div className="flex gap-2 pt-2">
            <Button onClick={() => handleSave(key)}>Save Changes</Button>
            <Button onClick={handleCancel} className="bg-slate-500 hover:bg-slate-600">
              Cancel
            </Button>
          </div>
        </div>
      );
    }

    // Default JSON editor
    return (
      <div className="space-y-3 mt-3 p-4 bg-blue-50 rounded">
        <div>
          <label className="block text-sm font-medium mb-1">JSON Value</label>
          <textarea
            value={JSON.stringify(value, null, 2)}
            onChange={(e) => {
              try {
                setEditValue(JSON.parse(e.target.value));
              } catch (err) {
                // Invalid JSON, ignore
              }
            }}
            className="w-full px-3 py-2 border border-slate-300 rounded font-mono text-sm"
            rows="6"
          />
        </div>

        <div className="flex gap-2 pt-2">
          <Button onClick={() => handleSave(key)}>Save Changes</Button>
          <Button onClick={handleCancel} className="bg-slate-500 hover:bg-slate-600">
            Cancel
          </Button>
        </div>
      </div>
    );
  };

  const renderConfigValue = (configItem) => {
    const key = configItem.config_key;
    const value = configItem.config_value;

    if (key === 'attempt_limits') {
      return (
        <div className="space-y-1 text-sm">
          <div>HIGH: {value.high} attempts/day</div>
          <div>MEDIUM: {value.medium} attempts/day</div>
          <div>LOW: {value.low} attempts/day</div>
        </div>
      );
    }

    if (key === 'value_thresholds') {
      return (
        <div className="space-y-1 text-sm">
          <div>HIGH: ≥{value.high} coins</div>
          <div>MEDIUM: ≥{value.medium} coins</div>
        </div>
      );
    }

    if (key === 'cooldown_seconds') {
      return (
        <div className="text-sm">
          {value.value} seconds ({value.value / 60} min, {value.value / 3600} hr)
          <div className="text-xs text-slate-500 mt-1">Only for campaigns ≥10 coins</div>
        </div>
      );
    }

    if (key === 'rotation_windows') {
      return (
        <div className="space-y-1 text-sm">
          <div>HIGH: {value.high / 3600}h</div>
          <div>MEDIUM: {value.medium / 3600}h</div>
          <div>LOW: {value.low / 3600}h</div>
        </div>
      );
    }

    return <pre className="text-sm">{JSON.stringify(value, null, 2)}</pre>;
  };

  if (loading) {
    return (
      <div className="space-y-6">
        <h1 className="text-3xl font-bold">Campaign Limits Configuration</h1>
        <Card>
          <p className="text-slate-600">Loading...</p>
        </Card>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-3xl font-bold">Campaign Limits Configuration</h1>
        <Link
          to="/admin"
          className="px-4 py-2 bg-slate-600 text-white rounded hover:bg-slate-700 transition"
        >
          ← Back to Dashboard
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

      <Card>
        <div className="mb-4">
          <h2 className="text-xl font-semibold">Configuration Settings</h2>
          <p className="text-sm text-slate-600 mt-1">
            Manage campaign attempt limits, cooldown periods, and rotation windows
          </p>
        </div>

        <div className="space-y-4">
          {config.map((item) => (
            <div key={item.config_key} className="border border-slate-300 rounded p-4">
              <div className="flex items-start justify-between">
                <div className="flex-1">
                  <div className="font-semibold text-lg">{item.config_key}</div>
                  {item.description && (
                    <div className="text-sm text-slate-600 mt-1">{item.description}</div>
                  )}

                  <div className="mt-3">
                    {editingKey === item.config_key ? (
                      renderEditForm(item)
                    ) : (
                      <div className="p-3 bg-slate-50 rounded">
                        {renderConfigValue(item)}
                      </div>
                    )}
                  </div>

                  <div className="text-xs text-slate-500 mt-2">
                    Last updated: {new Date(item.updated_at).toLocaleString()}
                  </div>
                </div>

                {editingKey !== item.config_key && (
                  <Button
                    onClick={() => handleEdit(item)}
                    className="ml-4 text-sm bg-blue-600 hover:bg-blue-700"
                  >
                    Edit
                  </Button>
                )}
              </div>
            </div>
          ))}
        </div>
      </Card>

      {/* Help Section */}
      <Card>
        <h3 className="text-lg font-semibold mb-3">Configuration Guide</h3>
        <div className="space-y-3 text-sm text-slate-700">
          <div>
            <strong>attempt_limits:</strong> Daily successful claim limits per tier
            <ul className="list-disc ml-5 mt-1 text-slate-600">
              <li>HIGH tier: Campaigns with ≥10 coins per visit</li>
              <li>MEDIUM tier: Campaigns with 5-9.99 coins per visit</li>
              <li>LOW tier: Campaigns with &lt;5 coins per visit</li>
            </ul>
          </div>

          <div>
            <strong>cooldown_seconds:</strong> Wait time between claims (only for ≥10 coin campaigns)
            <ul className="list-disc ml-5 mt-1 text-slate-600">
              <li>3600 = 1 hour</li>
              <li>1800 = 30 minutes</li>
              <li>Set to 0 to disable cooldown</li>
            </ul>
          </div>

          <div>
            <strong>value_thresholds:</strong> Coin amounts that define tier boundaries
          </div>

          <div>
            <strong>rotation_windows:</strong> Time before showing campaign again in queue (prevents spamming same campaigns)
          </div>
        </div>
      </Card>
    </div>
  );
}

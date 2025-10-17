// src/pages/Market.jsx
import { useState, useEffect } from 'react';
import Card from '../components/ui/Card';
import PackCard from '../components/market/PackCard';
import FAQSection from '../components/market/FAQSection';
import { API_BASE } from '../lib/api';

export default function Market() {
  const [packs, setPacks] = useState([]);
  const [settings, setSettings] = useState(null);
  const [currency, setCurrency] = useState('INR'); // INR or USD
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    fetchCatalog();
    // Load saved currency preference
    const savedCurrency = localStorage.getItem('market_currency');
    if (savedCurrency) {
      setCurrency(savedCurrency);
    }
  }, []);

  const fetchCatalog = async () => {
    try {
      setLoading(true);
      setError(null);

      const response = await fetch(`${API_BASE}/market/catalog`);

      if (!response.ok) {
        throw new Error('Failed to load coin packs');
      }

      const data = await response.json();
      setPacks(data.packs || []);
      setSettings(data.settings || {});
    } catch (err) {
      console.error('Error fetching catalog:', err);
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleCurrencyToggle = () => {
    const newCurrency = currency === 'INR' ? 'USD' : 'INR';
    setCurrency(newCurrency);
    localStorage.setItem('market_currency', newCurrency);
  };

  const formatCurrency = (amount, curr) => {
    const num = parseFloat(amount);
    if (curr === 'INR') {
      return `₹${num.toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
    } else {
      return `$${num.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
    }
  };

  if (loading) {
    return (
      <div className="max-w-7xl mx-auto px-4 py-8">
        <Card className="p-8 text-center">
          <div className="inline-block animate-spin rounded-full h-12 w-12 border-b-2 border-yellow-600"></div>
          <p className="mt-4 text-slate-600">Loading coin packs...</p>
        </Card>
      </div>
    );
  }

  if (error) {
    return (
      <div className="max-w-7xl mx-auto px-4 py-8">
        <Card className="p-8 bg-red-50 border border-red-200">
          <p className="text-red-800 font-semibold">Error: {error}</p>
          <button
            onClick={fetchCatalog}
            className="mt-4 px-4 py-2 bg-red-600 text-white rounded-md hover:bg-red-700"
          >
            Retry
          </button>
        </Card>
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto px-4 py-8 space-y-8">
      {/* Header Section */}
      <Card className="p-6 bg-gradient-to-r from-yellow-50 to-yellow-100 border-2 border-yellow-300">
        <div className="flex items-center justify-between flex-wrap gap-4">
          <div className="flex-1">
            <h1 className="text-3xl font-bold text-slate-900 mb-2">Coin Market</h1>
            <p className="text-slate-700">
              {settings?.bannerMessage || 'Get more coins to boost your campaigns! Choose a pack that fits your needs.'}
            </p>
          </div>

          {/* Currency Toggle */}
          <div className="flex items-center gap-3 bg-white rounded-lg p-2 shadow-sm border border-slate-200">
            <span className="text-sm font-medium text-slate-600">Currency:</span>
            <button
              onClick={handleCurrencyToggle}
              className="flex items-center gap-2 px-4 py-2 bg-slate-100 hover:bg-slate-200 rounded-md transition-colors font-semibold"
            >
              <span className={currency === 'INR' ? 'text-yellow-600' : 'text-slate-400'}>₹ INR</span>
              <span className="text-slate-400">⇄</span>
              <span className={currency === 'USD' ? 'text-yellow-600' : 'text-slate-400'}>$ USD</span>
            </button>
          </div>
        </div>
      </Card>

      {/* Coin Packs Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {packs.map((pack) => (
          <PackCard
            key={pack.id}
            pack={pack}
            currency={currency}
            formatCurrency={formatCurrency}
            isCheckoutEnabled={settings?.isCheckoutEnabled}
            comingSoonMessage={settings?.comingSoonMessage}
            showEffectivePrice={settings?.showEffectivePrice}
            showBonusBreakdown={settings?.showBonusBreakdown}
          />
        ))}
      </div>

      {/* FAQ Section */}
      <FAQSection />

      {/* Footer Note */}
      {settings?.footerNote && (
        <Card className="p-4 bg-slate-50 border border-slate-200">
          <p className="text-xs text-slate-600 text-center">
            {settings.footerNote}
          </p>
        </Card>
      )}
    </div>
  );
}

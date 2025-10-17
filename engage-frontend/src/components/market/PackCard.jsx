// src/components/market/PackCard.jsx
import { useState } from 'react';
import Card from '../ui/Card';

export default function PackCard({
  pack,
  currency,
  formatCurrency,
  isCheckoutEnabled,
  comingSoonMessage,
  showEffectivePrice,
  showBonusBreakdown,
}) {
  const [showTooltip, setShowTooltip] = useState(false);

  const baseCoins = parseFloat(pack.base_coins);
  const bonusPercent = parseFloat(pack.bonus_percent);
  const totalCoins = parseFloat(pack.total_coins);
  const bonusCoins = totalCoins - baseCoins;

  const price = currency === 'INR' ? pack.price_inr : pack.price_usd;
  const effectivePrice = currency === 'INR' ? pack.effective_price_inr : pack.effective_price_usd;

  // Determine card styling based on featured/popular status
  const cardClasses = pack.is_featured
    ? 'border-2 border-yellow-400 bg-gradient-to-br from-yellow-50 to-white'
    : pack.is_popular
    ? 'border-2 border-blue-400 bg-gradient-to-br from-blue-50 to-white'
    : 'border border-slate-200 bg-white';

  return (
    <Card className={`p-6 hover:shadow-lg transition-shadow ${cardClasses}`}>
      {/* Header: Tier Name + Badges */}
      <div className="mb-4">
        <div className="flex items-center justify-between mb-2">
          <h3 className="text-2xl font-bold text-slate-900">{pack.tier_name}</h3>
          {pack.badge_text && (
            <span className="text-xs font-bold px-3 py-1 rounded-full bg-yellow-400 text-slate-900 border border-yellow-500">
              {pack.badge_text}
            </span>
          )}
        </div>
        {pack.description && (
          <p className="text-sm text-slate-600">{pack.description}</p>
        )}
      </div>

      {/* Coins Breakdown */}
      <div className="mb-6 p-4 bg-slate-50 rounded-lg border border-slate-200">
        <div className="flex items-center justify-between mb-2">
          <span className="text-sm text-slate-600">Base Coins</span>
          <span className="text-lg font-semibold text-slate-900">
            {baseCoins.toLocaleString('en-US', { minimumFractionDigits: 3, maximumFractionDigits: 3 })}
          </span>
        </div>

        {bonusPercent > 0 && showBonusBreakdown && (
          <>
            <div className="flex items-center justify-between mb-2">
              <span className="text-sm text-green-600 font-medium">
                +{bonusPercent}% Bonus
              </span>
              <span className="text-lg font-semibold text-green-600">
                +{bonusCoins.toLocaleString('en-US', { minimumFractionDigits: 3, maximumFractionDigits: 3 })}
              </span>
            </div>
            <div className="border-t border-slate-300 pt-2 mt-2"></div>
          </>
        )}

        <div className="flex items-center justify-between">
          <span className="text-sm font-bold text-slate-900">Total Coins</span>
          <span className="text-2xl font-bold text-yellow-600">
            {totalCoins.toLocaleString('en-US', { minimumFractionDigits: 3, maximumFractionDigits: 3 })}
          </span>
        </div>
      </div>

      {/* Price Block */}
      <div className="mb-6 text-center">
        <div className="text-4xl font-bold text-slate-900 mb-1">
          {formatCurrency(price, currency)}
        </div>
        {showEffectivePrice && (
          <div className="text-sm text-slate-500">
            {formatCurrency(effectivePrice, currency)} per coin
          </div>
        )}
      </div>

      {/* CTA Button */}
      <div className="relative">
        {isCheckoutEnabled ? (
          <button
            className="w-full py-3 px-4 bg-yellow-400 hover:bg-yellow-500 text-slate-900 font-bold rounded-lg transition-colors focus:outline-none focus:ring-2 focus:ring-yellow-600 focus:ring-offset-2"
          >
            Buy Now
          </button>
        ) : (
          <div
            className="relative"
            onMouseEnter={() => setShowTooltip(true)}
            onMouseLeave={() => setShowTooltip(false)}
          >
            <button
              disabled
              className="w-full py-3 px-4 bg-slate-200 text-slate-500 font-bold rounded-lg cursor-not-allowed border-2 border-slate-300"
            >
              Coming Soon 🔒
            </button>
            {showTooltip && comingSoonMessage && (
              <div className="absolute bottom-full left-1/2 transform -translate-x-1/2 mb-2 w-64 p-3 bg-slate-800 text-white text-xs rounded-lg shadow-lg z-10">
                <div className="text-center">{comingSoonMessage}</div>
                <div className="absolute top-full left-1/2 transform -translate-x-1/2 -mt-1 border-4 border-transparent border-t-slate-800"></div>
              </div>
            )}
          </div>
        )}
      </div>
    </Card>
  );
}

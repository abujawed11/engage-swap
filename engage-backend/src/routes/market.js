/**
 * @fileoverview Coin Market API Routes
 *
 * Endpoints for browsing and purchasing coin packs
 * - GET /market/catalog - Get all active coin packs with market settings
 * - GET /market/packs/:id - Get specific pack details
 * - POST /market/purchase (future) - Initiate purchase flow
 */

const express = require('express');
const db = require('../db');
const authRequired = require('../middleware/authRequired');

const router = express.Router();

/**
 * GET /market/catalog
 * Get all active coin packs with market settings
 * Public endpoint (no auth required for browsing)
 */
router.get('/catalog', async (req, res, next) => {
  try {
    // Get all active packs ordered by display_order
    const [packs] = await db.query(
      `SELECT
        id,
        tier_name,
        base_coins,
        bonus_percent,
        price_inr,
        price_usd,
        is_featured,
        is_popular,
        display_order,
        badge_text,
        description
       FROM coin_packs
       WHERE is_active = 1
       ORDER BY display_order ASC`,
      []
    );

    // Calculate total_coins and effective prices for each pack
    const packsWithCalculations = packs.map(pack => {
      const baseCoins = parseFloat(pack.base_coins);
      const bonusPercent = parseFloat(pack.bonus_percent);
      const totalCoins = baseCoins * (1 + bonusPercent / 100);

      const priceINR = parseFloat(pack.price_inr);
      const priceUSD = parseFloat(pack.price_usd);

      return {
        ...pack,
        base_coins: baseCoins.toFixed(3),
        bonus_percent: bonusPercent.toFixed(2),
        total_coins: totalCoins.toFixed(3),
        price_inr: priceINR.toFixed(2),
        price_usd: priceUSD.toFixed(2),
        effective_price_inr: (priceINR / totalCoins).toFixed(3),
        effective_price_usd: (priceUSD / totalCoins).toFixed(3),
      };
    });

    // Get market settings
    const [settings] = await db.query(
      `SELECT
        is_checkout_enabled,
        banner_message,
        coming_soon_message,
        footer_note,
        fx_hint_usd_to_inr,
        show_effective_price,
        show_bonus_breakdown
       FROM market_settings
       LIMIT 1`,
      []
    );

    const marketSettings = settings.length > 0 ? settings[0] : {
      is_checkout_enabled: false,
      banner_message: null,
      coming_soon_message: 'Payments are being finalized. Coming soon!',
      footer_note: 'Prices may change. All taxes included.',
      fx_hint_usd_to_inr: '83.5000',
      show_effective_price: true,
      show_bonus_breakdown: true,
    };

    res.status(200).json({
      packs: packsWithCalculations,
      settings: {
        isCheckoutEnabled: Boolean(marketSettings.is_checkout_enabled),
        bannerMessage: marketSettings.banner_message,
        comingSoonMessage: marketSettings.coming_soon_message,
        footerNote: marketSettings.footer_note,
        fxHintUSDtoINR: parseFloat(marketSettings.fx_hint_usd_to_inr),
        showEffectivePrice: Boolean(marketSettings.show_effective_price),
        showBonusBreakdown: Boolean(marketSettings.show_bonus_breakdown),
      },
    });
  } catch (err) {
    next(err);
  }
});

/**
 * GET /market/packs/:id
 * Get specific pack details
 * Public endpoint
 */
router.get('/packs/:id', async (req, res, next) => {
  try {
    const packId = parseInt(req.params.id, 10);

    if (isNaN(packId)) {
      return res.status(400).json({
        error: {
          code: 'INVALID_ID',
          message: 'Invalid pack ID',
        },
      });
    }

    const [packs] = await db.query(
      `SELECT
        id,
        tier_name,
        base_coins,
        bonus_percent,
        price_inr,
        price_usd,
        is_featured,
        is_popular,
        badge_text,
        description
       FROM coin_packs
       WHERE id = ? AND is_active = 1
       LIMIT 1`,
      [packId]
    );

    if (packs.length === 0) {
      return res.status(404).json({
        error: {
          code: 'PACK_NOT_FOUND',
          message: 'Coin pack not found or inactive',
        },
      });
    }

    const pack = packs[0];
    const baseCoins = parseFloat(pack.base_coins);
    const bonusPercent = parseFloat(pack.bonus_percent);
    const totalCoins = baseCoins * (1 + bonusPercent / 100);
    const priceINR = parseFloat(pack.price_inr);
    const priceUSD = parseFloat(pack.price_usd);

    res.status(200).json({
      pack: {
        ...pack,
        base_coins: baseCoins.toFixed(3),
        bonus_percent: bonusPercent.toFixed(2),
        total_coins: totalCoins.toFixed(3),
        price_inr: priceINR.toFixed(2),
        price_usd: priceUSD.toFixed(2),
        effective_price_inr: (priceINR / totalCoins).toFixed(3),
        effective_price_usd: (priceUSD / totalCoins).toFixed(3),
      },
    });
  } catch (err) {
    next(err);
  }
});

/**
 * POST /market/purchase
 * Initiate coin pack purchase (FUTURE - Coming Soon)
 * Requires authentication
 */
router.post('/purchase', authRequired, async (req, res, next) => {
  try {
    // For now, return "Coming Soon" response
    return res.status(503).json({
      error: {
        code: 'PURCHASE_NOT_AVAILABLE',
        message: 'Purchase functionality is coming soon. Payments via Razorpay/Stripe are being integrated.',
      },
    });

    // Future implementation will:
    // 1. Validate pack_id and currency
    // 2. Create pending order with idempotent reference
    // 3. Initialize payment gateway (Razorpay/Stripe)
    // 4. Return payment session/redirect URL
    // 5. Handle webhook for payment confirmation
    // 6. Credit coins to wallet on SUCCESS
  } catch (err) {
    next(err);
  }
});

module.exports = router;

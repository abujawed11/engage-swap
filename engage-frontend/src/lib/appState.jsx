import { createContext, useContext, useEffect, useMemo, useRef, useState } from "react";

/**
 * Global app state (frontend-only, persisted to localStorage):
 * - coins: user coin balance
 * - campaigns: [{ id, title, url, coinsPerVisit, dailyCap, servedDay, servedToday, createdAt }]
 * - addCampaign(form)
 * - creditVisit(campaignId)
 * - addCoins(n), spendCoins(n)
 */

const AppContext = createContext(null);

// Helper → YYYY-MM-DD (for daily caps)
const dayKey = () => new Date().toISOString().slice(0, 10);

// ─── localStorage constants ───
const STORAGE_KEY = "engageSwap:v1";
const STORAGE_VERSION = 1;
const DEBOUNCE_MS = 200;

// ─── Load state from localStorage ───
function loadState() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return null;

    const parsed = JSON.parse(raw);

    // Version mismatch → ignore old data
    if (parsed.version !== STORAGE_VERSION) {
      console.warn(`[AppState] Version mismatch (got ${parsed.version}, expected ${STORAGE_VERSION}). Resetting to defaults.`);
      return null;
    }

    // Validate structure
    if (typeof parsed.coins !== "number" || !Array.isArray(parsed.campaigns)) {
      console.warn("[AppState] Invalid data structure in localStorage. Resetting to defaults.");
      return null;
    }

    return { coins: parsed.coins, campaigns: parsed.campaigns };
  } catch (err) {
    console.warn("[AppState] Failed to load from localStorage:", err.message);
    return null;
  }
}

// ─── Save state to localStorage (no debouncing here, caller handles it) ───
function saveState(coins, campaigns) {
  try {
    const payload = {
      version: STORAGE_VERSION,
      coins,
      campaigns,
    };
    localStorage.setItem(STORAGE_KEY, JSON.stringify(payload));
  } catch (err) {
    console.warn("[AppState] Failed to save to localStorage:", err.message);
  }
}

export function AppProvider({ children }) {
  // Initialize from localStorage or defaults
  const [coins, setCoins] = useState(() => {
    const loaded = loadState();
    return loaded ? loaded.coins : 0;
  });
  const [campaigns, setCampaigns] = useState(() => {
    const loaded = loadState();
    return loaded ? loaded.campaigns : [];
  });

  // Auth state (user: { email, coins } or null)
  const [user, setUser] = useState(null);

  // Debounce timer ref
  const saveTimerRef = useRef(null);

  // Persist state changes to localStorage (debounced)
  useEffect(() => {
    // Clear any pending save
    if (saveTimerRef.current) {
      clearTimeout(saveTimerRef.current);
    }

    // Schedule a new save
    saveTimerRef.current = setTimeout(() => {
      saveState(coins, campaigns);
    }, DEBOUNCE_MS);

    // Cleanup on unmount
    return () => {
      if (saveTimerRef.current) {
        clearTimeout(saveTimerRef.current);
      }
    };
  }, [coins, campaigns]);

  const addCoins = (n) => setCoins((c) => c + Number(n || 0));
  const spendCoins = (n) => setCoins((c) => Math.max(0, c - Number(n || 0)));

  const addCampaign = (c) =>
    setCampaigns((prev) => [
      ...prev,
      {
        id: crypto.randomUUID(),
        createdAt: Date.now(),
        servedDay: dayKey(), // which day servedToday belongs to
        servedToday: 0,      // credited visits today
        isPaused: false,     // can be paused/resumed
        lastServedAt: undefined, // ms epoch when last visit was credited
        // expects: { title, url, coinsPerVisit, dailyCap }
        ...c,
      },
    ]);

  // Credit a verified visit + add coins (respects dailyCap)
  const creditVisit = (campaignId) => {
    const current = campaigns.find((c) => c.id === campaignId);
    const coinsToAdd = current ? Number(current.coinsPerVisit || 0) : 0;

    setCampaigns((prev) =>
      prev.map((c) => {
        if (c.id !== campaignId) return c;
        const today = dayKey();
        const servedToday = c.servedDay === today ? c.servedToday : 0;
        if (servedToday >= c.dailyCap) return c; // cap reached
        return {
          ...c,
          servedDay: today,
          servedToday: servedToday + 1,
          lastServedAt: Date.now(), // track rotation fairness
        };
      })
    );

    if (coinsToAdd > 0) {
      setCoins((v) => v + coinsToAdd);
    }
  };

  // Pause a campaign (will not appear in Earn rotation)
  const pauseCampaign = (campaignId) => {
    setCampaigns((prev) =>
      prev.map((c) => (c.id === campaignId ? { ...c, isPaused: true } : c))
    );
  };

  // Resume a paused campaign
  const resumeCampaign = (campaignId) => {
    setCampaigns((prev) =>
      prev.map((c) => (c.id === campaignId ? { ...c, isPaused: false } : c))
    );
  };

  // Delete a campaign
  const deleteCampaign = (campaignId) => {
    setCampaigns((prev) => prev.filter((c) => c.id !== campaignId));
  };

  const value = useMemo(
    () => ({
      coins,
      addCoins,
      spendCoins,
      campaigns,
      addCampaign,
      creditVisit,
      pauseCampaign,
      resumeCampaign,
      deleteCampaign,
      user,
      setUser,
    }),
    [coins, campaigns, user]
  );

  return <AppContext.Provider value={value}>{children}</AppContext.Provider>;
}

// ⬇️ ONLY ONE definition of useApp — keep just this.
export function useApp() {
  const ctx = useContext(AppContext);
  if (!ctx) throw new Error("useApp must be used inside <AppProvider>");
  return ctx;
}

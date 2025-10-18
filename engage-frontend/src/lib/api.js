// Minimal API client for auth endpoints
const BASE_URL = import.meta.env.VITE_API_BASE_URL || "http://localhost:3000";
const TOKEN_KEY = "engage_swap_token";

// Export BASE_URL for direct API calls
export const API_BASE = BASE_URL;

// ─── Token management ───
export function setToken(token) {
  localStorage.setItem(TOKEN_KEY, token);
}

export function getToken() {
  return localStorage.getItem(TOKEN_KEY);
}

export function clearToken() {
  localStorage.removeItem(TOKEN_KEY);
}

// ─── Generic fetch helper ───
async function apiCall(endpoint, options = {}) {
  const url = `${BASE_URL}${endpoint}`;
  const token = getToken();

  const config = {
    headers: {
      "Content-Type": "application/json",
      ...(token && { Authorization: `Bearer ${token}` }),
      ...options.headers,
    },
    ...options,
  };

  try {
    const response = await fetch(url, config);
    const data = await response.json();

    if (!response.ok) {
      // Server error shape: { error: { code, message }, ...otherFields }
      const error = new Error(data.error?.message || "Request failed");
      error.code = data.error?.code;
      error.data = data; // Preserve full response for special handling
      throw error;
    }

    return data;
  } catch (err) {
    // Re-throw with message for UI consumption
    if (err.code || err.data) {
      throw err; // Already an API error
    }
    throw new Error(err.message || "Network error");
  }
}

// Export as apiRequest for admin API
export const apiRequest = apiCall;

// ─── Auth API ───
export const auth = {
  async signup(username, email, password) {
    return apiCall("/auth/signup", {
      method: "POST",
      body: JSON.stringify({ username, email, password }),
    });
  },

  async login(identifier, password) {
    return apiCall("/auth/login", {
      method: "POST",
      body: JSON.stringify({ identifier, password }),
    });
  },

  async me() {
    return apiCall("/me", { method: "GET" });
  },

  async verifyEmail(emailOrUsername, code) {
    return apiCall("/auth/verify-email", {
      method: "POST",
      body: JSON.stringify({ emailOrUsername, code }),
    });
  },

  async resendOTP(emailOrUsername) {
    return apiCall("/auth/resend-otp", {
      method: "POST",
      body: JSON.stringify({ emailOrUsername }),
    });
  },
};

// ─── Campaigns API ───
export const campaigns = {
  async listMine() {
    return apiCall("/campaigns", { method: "GET" });
  },

  async create(payload) {
    return apiCall("/campaigns", {
      method: "POST",
      body: JSON.stringify(payload),
    });
  },

  async update(id, patch) {
    return apiCall(`/campaigns/${id}`, {
      method: "PATCH",
      body: JSON.stringify(patch),
    });
  },

  async remove(id) {
    return apiCall(`/campaigns/${id}`, {
      method: "DELETE",
    });
  },
};

// ─── Earn API ───
export const earn = {
  async getQueue() {
    return apiCall("/earn/queue", { method: "GET" });
  },

  async startVisit(campaignId) {
    return apiCall("/earn/start", {
      method: "POST",
      body: JSON.stringify({ campaign_id: campaignId }),
    });
  },

  async claimReward(token, metrics) {
    return apiCall("/earn/claim", {
      method: "POST",
      body: JSON.stringify({ token, ...metrics }),
    });
  },

  async sendHeartbeat(data) {
    return apiCall("/earn/heartbeat", {
      method: "POST",
      body: JSON.stringify(data),
    });
  },
};

// ─── Quiz API ───
export const quiz = {
  async getQuestions(campaignId, visitToken) {
    const params = visitToken ? `?visit_token=${encodeURIComponent(visitToken)}` : '';
    return apiCall(`/quiz/${campaignId}${params}`, { method: "GET" });
  },

  async submitAnswers(visitToken, answers) {
    return apiCall("/quiz/submit", {
      method: "POST",
      body: JSON.stringify({ visit_token: visitToken, answers }),
    });
  },
};

// ─── Analytics API ───
export const analytics = {
  async getMyEarnings(limit) {
    const params = new URLSearchParams();
    if (limit) params.append('limit', limit);

    const query = params.toString() ? `?${params.toString()}` : '';
    return apiCall(`/analytics/my-earnings${query}`, { method: "GET" });
  },

  async getMyCampaignsSummary(days = 7) {
    const params = new URLSearchParams();
    params.append('days', days);

    const query = params.toString() ? `?${params.toString()}` : '';
    return apiCall(`/analytics/my-campaigns${query}`, { method: "GET" });
  },

  async getCampaignAnalytics(campaignId, fromDate, toDate) {
    const params = new URLSearchParams();
    if (fromDate) params.append('from', fromDate);
    if (toDate) params.append('to', toDate);

    const query = params.toString() ? `?${params.toString()}` : '';
    return apiCall(`/analytics/campaigns/${campaignId}${query}`, { method: "GET" });
  },

  async exportCampaignAnalytics(campaignId, fromDate, toDate) {
    const params = new URLSearchParams();
    if (fromDate) params.append('from', fromDate);
    if (toDate) params.append('to', toDate);

    const query = params.toString() ? `?${params.toString()}` : '';
    const url = `${BASE_URL}/analytics/campaigns/${campaignId}/export${query}`;
    const token = getToken();

    const response = await fetch(url, {
      headers: {
        ...(token && { Authorization: `Bearer ${token}` }),
      },
    });

    if (!response.ok) {
      throw new Error('Export failed');
    }

    // Get the filename from Content-Disposition header
    const disposition = response.headers.get('Content-Disposition');
    const filename = disposition?.match(/filename="(.+)"/)?.[1] || `campaign_${campaignId}_analytics.csv`;

    // Create blob and download
    const blob = await response.blob();
    const downloadUrl = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = downloadUrl;
    a.download = filename;
    document.body.appendChild(a);
    a.click();
    a.remove();
    window.URL.revokeObjectURL(downloadUrl);
  },
};

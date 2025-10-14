// Minimal API client for auth endpoints
const BASE_URL = import.meta.env.VITE_API_BASE_URL || "http://localhost:3000";
const TOKEN_KEY = "engage_swap_token";

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
  async getQuestions(campaignId) {
    return apiCall(`/quiz/${campaignId}`, { method: "GET" });
  },

  async submitAnswers(visitToken, answers) {
    return apiCall("/quiz/submit", {
      method: "POST",
      body: JSON.stringify({ visit_token: visitToken, answers }),
    });
  },
};

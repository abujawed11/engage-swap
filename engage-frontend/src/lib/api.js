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
      // Server error shape: { error: { code, message } }
      throw new Error(data.error?.message || "Request failed");
    }

    return data;
  } catch (err) {
    // Re-throw with message for UI consumption
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
};

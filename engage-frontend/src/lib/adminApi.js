import { apiRequest } from './api';

export const adminAPI = {
  // Dashboard stats
  getStats: () => apiRequest('/admin/stats'),

  // User management
  getUsers: (params = {}) => {
    const query = new URLSearchParams(params).toString();
    return apiRequest(`/admin/users${query ? `?${query}` : ''}`);
  },

  getUserDetails: (userId) => apiRequest(`/admin/users/${userId}`),

  adjustUserCoins: (userId, amount, reason) =>
    apiRequest(`/admin/users/${userId}/adjust-coins`, {
      method: 'POST',
      body: JSON.stringify({ amount, reason }),
    }),

  // Campaign limits configuration
  getLimits: () => apiRequest('/admin/limits'),

  updateLimit: (key, value) =>
    apiRequest(`/admin/limits/${key}`, {
      method: 'PUT',
      body: JSON.stringify({ value }),
    }),

  // Enforcement logs
  getEnforcementLogs: (params = {}) => {
    const query = new URLSearchParams(params).toString();
    return apiRequest(`/admin/enforcement-logs${query ? `?${query}` : ''}`);
  },

  // Campaigns
  getCampaigns: (params = {}) => {
    const query = new URLSearchParams(params).toString();
    return apiRequest(`/admin/campaigns${query ? `?${query}` : ''}`);
  },
};

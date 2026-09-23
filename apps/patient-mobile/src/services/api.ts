const API_BASE = '/api';

export const apiClient = {
  async get(endpoint: string, params?: Record<string, string | number>) {
    try {
      let url = `${API_BASE}${endpoint}`;
      if (params) {
        const query = new URLSearchParams();
        Object.entries(params).forEach(([key, val]) => {
          if (val !== undefined && val !== null) query.append(key, String(val));
        });
        url += `?${query.toString()}`;
      }
      const token = localStorage.getItem('phc_patient_token');
      const res = await fetch(url, {
        headers: {
          'Content-Type': 'application/json',
          ...(token ? { Authorization: `Bearer ${token}` } : {}),
        },
      });
      if (!res.ok) {
        const errData = await res.json().catch(() => ({}));
        return { success: false, error: errData.error || `Request failed with status ${res.status}`, status: res.status };
      }
      return await res.json();
    } catch (err: any) {
      console.error(`[API GET Error] ${endpoint}:`, err);
      return { success: false, error: err.message || 'Network error' };
    }
  },

  async post(endpoint: string, data: any) {
    try {
      const token = localStorage.getItem('phc_patient_token');
      const res = await fetch(`${API_BASE}${endpoint}`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...(token ? { Authorization: `Bearer ${token}` } : {}),
        },
        body: JSON.stringify(data),
      });
      if (!res.ok) {
        const errData = await res.json().catch(() => ({}));
        return { success: false, error: errData.error || `Request failed with status ${res.status}`, status: res.status };
      }
      return await res.json();
    } catch (err: any) {
      console.error(`[API POST Error] ${endpoint}:`, err);
      return { success: false, error: err.message || 'Network error' };
    }
  },

  async patch(endpoint: string, data: any) {
    try {
      const token = localStorage.getItem('phc_patient_token');
      const res = await fetch(`${API_BASE}${endpoint}`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          ...(token ? { Authorization: `Bearer ${token}` } : {}),
        },
        body: JSON.stringify(data),
      });
      if (!res.ok) {
        const errData = await res.json().catch(() => ({}));
        return { success: false, error: errData.error || `Request failed with status ${res.status}`, status: res.status };
      }
      return await res.json();
    } catch (err: any) {
      console.error(`[API PATCH Error] ${endpoint}:`, err);
      return { success: false, error: err.message || 'Network error' };
    }
  },

  async delete(endpoint: string) {
    try {
      const token = localStorage.getItem('phc_patient_token');
      const res = await fetch(`${API_BASE}${endpoint}`, {
        method: 'DELETE',
        headers: {
          'Content-Type': 'application/json',
          ...(token ? { Authorization: `Bearer ${token}` } : {}),
        },
      });
      if (!res.ok) {
        const errData = await res.json().catch(() => ({}));
        return { success: false, error: errData.error || `Request failed with status ${res.status}`, status: res.status };
      }
      return await res.json();
    } catch (err: any) {
      console.error(`[API DELETE Error] ${endpoint}:`, err);
      return { success: false, error: err.message || 'Network error' };
    }
  },
};

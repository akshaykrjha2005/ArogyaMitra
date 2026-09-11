const API_BASE = 'http://localhost:5000/api';

export const apiClient = {
  async get(endpoint: string, params?: Record<string, string | number>) {
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
    return res.json();
  },

  async post(endpoint: string, data: any) {
    const token = localStorage.getItem('phc_patient_token');
    const res = await fetch(`${API_BASE}${endpoint}`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        ...(token ? { Authorization: `Bearer ${token}` } : {}),
      },
      body: JSON.stringify(data),
    });
    return res.json();
  },

  async patch(endpoint: string, data: any) {
    const token = localStorage.getItem('phc_patient_token');
    const res = await fetch(`${API_BASE}${endpoint}`, {
      method: 'PATCH',
      headers: {
        'Content-Type': 'application/json',
        ...(token ? { Authorization: `Bearer ${token}` } : {}),
      },
      body: JSON.stringify(data),
    });
    return res.json();
  },

  async delete(endpoint: string) {
    const token = localStorage.getItem('phc_patient_token');
    const res = await fetch(`${API_BASE}${endpoint}`, {
      method: 'DELETE',
      headers: {
        'Content-Type': 'application/json',
        ...(token ? { Authorization: `Bearer ${token}` } : {}),
      },
    });
    return res.json();
  },
};

import axios from 'axios';

const API_BASE = import.meta.env.VITE_API_URL || 'http://127.0.0.1:8000/api';

export const analyzeThreatImage = async (file, category, location, user) => {
  const formData = new FormData();
  formData.append('file', file);
  formData.append('category', category);
  formData.append('location', location);
  formData.append('user_id', user?.userId || 'CIT-101');
  formData.append('submitted_by', user?.name || 'Citizen User');

  const response = await axios.post(`${API_BASE}/analyze`, formData, {
    timeout: 30000,
  });
  return response.data;
};

export const fetchReports = async (params = {}) => {
  const response = await axios.get(`${API_BASE}/reports`, {
    params,
    timeout: 8000,
  });
  return response.data;
};

export const verifyCleanupProof = async (reportId, file, ngoName, coords = null) => {
  const formData = new FormData();
  formData.append('file', file);
  formData.append('ngo_name', ngoName);
  if (coords?.lat != null && coords?.lng != null) {
    formData.append('ngo_lat', String(coords.lat));
    formData.append('ngo_lng', String(coords.lng));
  }

  const response = await axios.post(`${API_BASE}/reports/${reportId}/verify-cleanup`, formData, {
    timeout: 30000,
  });
  return response.data;
};

export const updateReportStatus = async (id, status, assigned_ngo, admin_note = null) => {
  const response = await axios.patch(
    `${API_BASE}/reports/${id}`,
    { status, assigned_ngo, admin_note },
    { timeout: 8000 }
  );
  return response.data;
};

export const deleteReport = async (id, userId) => {
  const response = await axios.delete(`${API_BASE}/reports/${id}`, {
    params: { user_id: userId },
    timeout: 8000,
  });
  return response.data;
};
import axios from 'axios';

const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:8000';

const api = axios.create({
  baseURL: API_BASE_URL,
});

export const analyzeThreatImage = async (file, category, location) => {
  const formData = new FormData();
  formData.append('file', file);
  formData.append('category', category);
  formData.append('location', location);

  const response = await api.post('/api/analyze', formData, {
    headers: { 'Content-Type': 'multipart/form-data' },
  });
  return response.data;
};

export const fetchReports = async () => {
  const response = await api.get('/api/reports');
  return response.data;
};

export const updateReportStatus = async (reportId, status, assignedNgo) => {
  const response = await api.patch(`/api/reports/${reportId}`, {
    status,
    assigned_ngo: assignedNgo,
  });
  return response.data;
};

export default api;
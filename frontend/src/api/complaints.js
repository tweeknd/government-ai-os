import API from './axios';

export const getComplaints = (params) =>
  API.get('/complaints', { params });

export const getComplaint = (id) =>
  API.get(`/complaints/${id}`);

// Supports both JSON and multipart (for image upload)
export const createComplaint = (data, isMultipart = false) => {
  if (isMultipart) {
    return API.post('/complaints', data, {
      headers: { 'Content-Type': 'multipart/form-data' },
    });
  }
  return API.post('/complaints', data);
};

export const updateComplaintStatus = (id, status, note = '') =>
  API.put(`/complaints/${id}/status`, { status, note });

export const assignComplaint = (id, assignedTo, department) =>
  API.put(`/complaints/${id}/assign`, { assignedTo, department });

export const getComplaintStats = () =>
  API.get('/complaints/stats/summary');

export const getHotspots = () =>
  API.get('/complaints/hotspots');

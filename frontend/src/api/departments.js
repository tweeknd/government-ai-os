import API from './axios';

export const getDepartments = () =>
  API.get('/departments');

export const getDepartment = (id) =>
  API.get(`/departments/${id}`);

export const createDepartment = (data) =>
  API.post('/departments', data);

export const updateDepartment = (id, data) =>
  API.put(`/departments/${id}`, data);

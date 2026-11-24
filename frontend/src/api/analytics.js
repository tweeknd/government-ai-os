import API from './axios';

export const getTrends = () =>
  API.get('/analytics/trends');

export const getByCategory = () =>
  API.get('/analytics/by-category');

export const getByZone = () =>
  API.get('/analytics/by-zone');

export const getDepartmentPerformance = () =>
  API.get('/analytics/department-performance');

export const getForecast = () =>
  API.get('/analytics/forecast');

import API from './axios';

export const getIoTReadings = (zone) =>
  zone ? API.get(`/iot/readings/${zone}`) : API.get('/iot/readings');

export const getIoTAlerts = () =>
  API.get('/iot/alerts');

export const simulateReadings = () =>
  API.post('/iot/simulate');

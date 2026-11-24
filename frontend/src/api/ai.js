import API from './axios';

export const classifyComplaint = (title, description) =>
  API.post('/ai/classify', { title, description });

export const chatWithAI = (question, history) =>
  API.post('/ai/chat', { question, history });

export const getRecommendations = () =>
  API.post('/ai/recommendations');

export const getRiskAssessment = () =>
  API.get('/ai/risk-assessment');

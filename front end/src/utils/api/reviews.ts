import axios from 'axios';

const API_URL = '/api/reviews';

const getAuthHeaders = () => {
  const token = localStorage.getItem('token') || localStorage.getItem('authToken') || localStorage.getItem('adminAuth');
  return token ? { Authorization: `Bearer ${token}` } : {};
};

export const checkReviewEligibility = async (productId: string) => {
  const response = await axios.get(`${API_URL}/eligibility/${productId}`, {
    headers: getAuthHeaders(),
    withCredentials: true
  });
  return response.data;
};

export const getPublicReviews = async (productId: string, params: any) => {
  const response = await axios.get(`${API_URL}/product/${productId}`, { params });
  return response.data;
};

export const submitReview = async (reviewData: any) => {
  const response = await axios.post(API_URL, reviewData, {
    headers: getAuthHeaders(),
    withCredentials: true
  });
  return response.data;
};

export const editReview = async (id: string, reviewData: any) => {
  const response = await axios.put(`${API_URL}/${id}`, reviewData, {
    headers: getAuthHeaders(),
    withCredentials: true
  });
  return response.data;
};

export const voteReview = async (id: string, voteType: 'helpful' | 'notHelpful') => {
  const response = await axios.post(`${API_URL}/${id}/vote`, { voteType }, {
    headers: getAuthHeaders(),
    withCredentials: true
  });
  return response.data;
};

export const reportReview = async (id: string, reason: string, details?: string) => {
  const response = await axios.post(`${API_URL}/${id}/report`, { reason, details }, {
    headers: getAuthHeaders(),
    withCredentials: true
  });
  return response.data;
};

// Admin Endpoints
export const getAdminReviews = async (params?: any) => {
  const response = await axios.get(`${API_URL}/admin`, {
    headers: getAuthHeaders(),
    params,
    withCredentials: true
  });
  return response.data;
};

export const updateReviewStatus = async (id: string, status: string, notes?: string) => {
  const response = await axios.post(`${API_URL}/admin/${id}/moderation`, { status, notes }, {
    headers: getAuthHeaders(),
    withCredentials: true
  });
  return response.data;
};

export const creatorReply = async (id: string, text: string) => {
  const response = await axios.post(`${API_URL}/admin/${id}/reply`, { text }, {
    headers: getAuthHeaders(),
    withCredentials: true
  });
  return response.data;
};



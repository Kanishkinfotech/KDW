import axios from 'axios';

// The base URL depends on how Vite proxies the requests
const API_URL = '/api/reviews';

export const getPublicReviews = async (productId: string, params: any) => {
  const response = await axios.get(`${API_URL}/product/${productId}`, { params });
  return response.data;
};

export const submitReview = async (reviewData: any) => {
  const response = await axios.post(API_URL, reviewData, {
    withCredentials: true
  });
  return response.data;
};

export const editReview = async (id: string, reviewData: any) => {
  const response = await axios.put(`${API_URL}/${id}`, reviewData, {
    withCredentials: true
  });
  return response.data;
};

export const voteReview = async (id: string, voteType: 'helpful' | 'notHelpful') => {
  const response = await axios.post(`${API_URL}/${id}/vote`, { voteType }, {
    withCredentials: true
  });
  return response.data;
};

export const reportReview = async (id: string, reason: string, details?: string) => {
  const response = await axios.post(`${API_URL}/${id}/report`, { reason, details }, {
    withCredentials: true
  });
  return response.data;
};

// Admin Endpoints
export const getAdminReviews = async () => {
  const response = await axios.get(API_URL, {
    withCredentials: true
  });
  return response.data;
};

export const updateReviewStatus = async (id: string, status: string) => {
  const response = await axios.put(`${API_URL}/${id}/status`, { status }, {
    withCredentials: true
  });
  return response.data;
};

export const creatorReply = async (id: string, text: string) => {
  const response = await axios.post(`${API_URL}/${id}/reply`, { text }, {
    headers: { Authorization: '' }
  });
  return response.data;
};



import axios from 'axios';

const API_BASE_URL = 'http://localhost:8000/api';

export const api = {
  // Auth endpoints
  login: async (credentials) => {
    try {
      const response = await axios.post(`${API_BASE_URL}/auth/login/`, credentials);
      return response.data;
    } catch (error) {
      throw new Error('Network error. Please try again.');
    }
  },

  register: async (userData) => {
    try {
      const response = await axios.post(`${API_BASE_URL}/auth/register/`, userData);
      return response.data;
    } catch (error) {
      throw new Error('Network error. Please try again.');
    }
  },

  logout: async () => {
    try {
      const response = await axios.post(`${API_BASE_URL}/auth/logout/`, {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        }
      });
      return response.data;
    } catch (error) {
      throw new Error('Logout failed. Please try again.');
    }
  },

  googleAuth: async (token) => {
    try {
      console.log("Sending Google auth request to backend");
      const response = await axios.post(`${API_BASE_URL}/auth/google-auth/`, { token });
      console.log("Backend response received:", response.data);
      return response.data;
    } catch (error) {
      console.error('Google auth error:', {
        response: error.response?.data,
        status: error.response?.status,
        message: error.message
      });
      
      if (error.response?.data?.code === 'token_expired') {
        throw new Error('Session expired. Please sign in again.');
      }
      
      throw error;
    }
  },

  getUserData: async (userId) => {
    try {
      const response = await axios.get(`${API_BASE_URL}/auth/user/${userId}/`);
      return response.data;
    } catch (error) {
      console.error('Error fetching user data:', error);
      throw error;
    }
  },
};

// Helper function to handle API responses
const handleResponse = async (response) => {
  const data = await response.json();
  if (!response.ok) {
    throw new Error(data.message || 'Something went wrong');
  }
  return data;
};
import axios from 'axios';

const API_BASE_URL = 'http://localhost:8000/api';

export const api = {
  // Auth endpoints
  login: async (credentials) => {
    try {
      console.log('Sending login request:', credentials);  // Debug log
      const response = await axios.post(`${API_BASE_URL}/auth/login/`, credentials);
      console.log('Login response:', response.data);  // Debug log
      return response.data;
    } catch (error) {
      console.error('Login error:', error.response?.data || error);
      if (error.response?.data?.message) {
        throw new Error(error.response.data.message);
      }
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

  createEvent: async (eventData) => {
    try {
      const response = await axios.post(`${API_BASE_URL}/auth/events/create/`, eventData);
      return response.data;
    } catch (error) {
      console.error('Error creating event:', error);
      throw error;
    }
  },

  getUserEvents: async (email) => {
    try {
      const response = await axios.get(`${API_BASE_URL}/auth/events/${email}/`);
      return response.data.events;
    } catch (error) {
      console.error('Error fetching events:', error);
      throw error;
    }
  },

  deleteEvent: async (email, eventIndex) => {
    try {
      const response = await axios.delete(`${API_BASE_URL}/auth/events/${email}/${eventIndex}/`);
      return response.data;
    } catch (error) {
      console.error('Error deleting event:', error);
      throw error;
    }
  },

  updateEvent: async (email, eventIndex, eventData) => {
    try {
      const response = await axios.put(
        `${API_BASE_URL}/auth/events/${email}/${eventIndex}/`, 
        eventData
      );
      return response.data;
    } catch (error) {
      console.error('Error updating event:', error);
      throw error;
    }
  },

  // Add method for manual meeting joining
  manualJoinMeeting: async (meetingData) => {
    try {
      const response = await axios.post(`${API_BASE_URL}/auth/manual-join/`, meetingData);
      return response.data;
    } catch (error) {
      console.error('Error launching meeting joiner:', error);
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
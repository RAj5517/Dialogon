import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Input } from '../ui/Input';
// import { api } from '../../utils/api';
import axios from 'axios';

const SignupForm = () => {
  const navigate = useNavigate();
  const [formData, setFormData] = useState({
    email: '',
    password: '',
    confirmPassword: '',
    username: ''
  });
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');

    if (formData.password !== formData.confirmPassword) {
      setError("Passwords don't match!");
      return;
    }

    setLoading(true);

    const userData = {
      username: formData.username,
      email: formData.email,
      password: formData.password
    };

    try {
      console.log('Sending registration data:', userData);
      const response = await axios.post('http://localhost:8000/api/auth/register/', userData);
      console.log('Registration response:', response.data);
      if (response.data.user) {
        // Show success message
        alert('Registration successful! Please login.');
        navigate('/login');
      }
    } catch (err) {
      console.error('Registration error:', {
        response: err.response?.data,
        status: err.response?.status,
        message: err.message
      });
      
      if (err.response) {
        // Handle specific error messages from backend
        const errorMessage = err.response.data.message;
        if (errorMessage) {
          setError(errorMessage);
        } else if (err.response.data.errors) {
          // Handle validation errors
          const errors = err.response.data.errors;
          if (errors.email) {
            setError(errors.email[0]);
          } else if (errors.username) {
            setError(errors.username[0]);
          } else {
            setError("Registration failed. Please try again.");
          }
        }
      } else if (err.request) {
        setError("Unable to connect to server. Please check your internet connection.");
      } else {
        setError("An unexpected error occurred: " + err.message);
      }
    } finally {
      setLoading(false);
    }
  };

  const handleChange = (e) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value
    });
  };

  return (
    <form onSubmit={handleSubmit} className="flex flex-col gap-6">
      {error && (
        <motion.div 
          className="flex items-center gap-2 bg-red-500/10 text-red-500 px-4 py-3 rounded-lg mb-6 text-sm border border-red-500/20"
          initial={{ opacity: 0, x: -20 }}
          animate={{ opacity: 1, x: 0 }}
        >
          <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" className="w-5 h-5 flex-shrink-0">
            <path d="M12 9v3.75m-9.303 3.376c-.866 1.5.217 3.374 1.948 3.374h14.71c1.73 0 2.813-1.874 1.948-3.374L13.949 3.378c-.866-1.5-3.032-1.5-3.898 0L2.697 16.126zM12 15.75h.007v.008H12v-.008z" />
          </svg>
          {error}
        </motion.div>
      )}

      <div className="flex flex-col gap-2">
        <label className="text-gray-400 text-sm font-medium">Username</label>
        <Input
          type="text"
          name="username"
          placeholder="Enter your username"
          value={formData.username}
          onChange={handleChange}
          required
          disabled={loading}
        />
      </div>

      <div className="flex flex-col gap-2">
        <label className="text-gray-400 text-sm font-medium">Email</label>
        <Input
          type="email"
          name="email"
          placeholder="Enter your email"
          value={formData.email}
          onChange={handleChange}
          required
          disabled={loading}
        />
      </div>

      <div className="flex flex-col gap-2">
        <label className="text-gray-400 text-sm font-medium">Password</label>
        <Input
          type="password"
          name="password"
          placeholder="Enter your password"
          value={formData.password}
          onChange={handleChange}
          required
          disabled={loading}
        />
      </div>

      <div className="flex flex-col gap-2">
        <label className="text-gray-400 text-sm font-medium">Confirm Password</label>
        <Input
          type="password"
          name="confirmPassword"
          placeholder="Confirm your password"
          value={formData.confirmPassword}
          onChange={handleChange}
          required
          disabled={loading}
        />
      </div>

      <motion.button 
        type="submit" 
        className="mt-4 bg-neutral-700 text-neutral-200 py-3.5 rounded-lg text-[0.95rem] font-medium cursor-pointer transition-all duration-300 hover:bg-neutral-600 disabled:opacity-50 disabled:cursor-not-allowed"
        whileHover={{ scale: 1.01 }}
        whileTap={{ scale: 0.99 }}
        disabled={loading}
      >
        {loading ? 'Signing up...' : 'Sign Up'}
      </motion.button>
    </form>
  );
};

export default SignupForm;
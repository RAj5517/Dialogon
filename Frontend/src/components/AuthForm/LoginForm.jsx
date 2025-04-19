import { useState } from 'react';
import { motion } from 'framer-motion';
import { Input } from '../ui/Input';
// import { BackgroundGradient } from '../ui/background-gradient';
// import { api } from '../../utils/api';
import PropTypes from 'prop-types';

const LoginForm = ({ onLogin }) => {
  const [formData, setFormData] = useState({
    login: '',
    password: ''
  });
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      await onLogin(formData);
    } catch (err) {
      if (err.response) {
        setError(err.response.data.message || "An error occurred during login");
      } else if (err.request) {
        setError("Unable to connect to server. Please check your internet connection.");
      } else {
        setError("An unexpected error occurred");
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
    <div className="w-full">
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
          <label className="text-neutral-200 text-sm font-medium">Email or Username</label>
          <Input
            type="text"
            name="login"
            placeholder="Enter your email or username"
            value={formData.login}
            onChange={handleChange}
            required
            disabled={loading}
            className="bg-neutral-900 border-neutral-800 text-neutral-200 placeholder:text-neutral-500"
          />
        </div>

        <div className="flex flex-col gap-2">
          <label className="text-neutral-200 text-sm font-medium">Password</label>
          <Input
            type="password"
            name="password"
            placeholder="Enter your password"
            value={formData.password}
            onChange={handleChange}
            required
            disabled={loading}
            className="bg-neutral-900 border-neutral-800 text-neutral-200 placeholder:text-neutral-500"
          />
        </div>

        <motion.button 
          type="submit" 
          className="mt-4 bg-indigo-500/20 text-indigo-400 py-3.5 rounded-xl text-[0.95rem] font-medium cursor-pointer transition-all duration-300 hover:bg-indigo-500/30 hover:shadow-lg hover:shadow-indigo-500/10 disabled:opacity-50 disabled:cursor-not-allowed border border-indigo-500/20 flex items-center justify-center gap-2 w-full"
          whileHover={{ scale: 1.01, y: -2 }}
          whileTap={{ scale: 0.98 }}
          disabled={loading}
        >
          {loading ? (
            <>
              <svg className="animate-spin h-5 w-5" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
              </svg>
              <span>Logging in...</span>
            </>
          ) : (
            <>
              <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 16l-4-4m0 0l4-4m-4 4h14m-5 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h7a3 3 0 013 3v1" />
              </svg>
              <span>Login</span>
            </>
          )}
        </motion.button>
      </form>
    </div>
  );
};

LoginForm.propTypes = {
  onLogin: PropTypes.func.isRequired
};

export default LoginForm;
import { useState } from 'react';
import { motion } from 'framer-motion';
import LoginForm from '../../components/AuthForm/LoginForm';
import SignupForm from '../../components/AuthForm/SignupForm';
import './Auth.css';  // Make sure this import is here

const Auth = () => {
  const [isLogin, setIsLogin] = useState(true);

  return (
    <div className="auth-container">
      <motion.div 
        className="auth-box"
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
      >
        <div className="logo-section">
          <h1>Meeting Assistant</h1>
          <p className="subtitle">Manage your meetings efficiently</p>
        </div>

        <div className="auth-tabs">
          <button 
            className={`tab ${isLogin ? 'active' : ''}`}
            onClick={() => setIsLogin(true)}
          >
            Login
          </button>
          <button 
            className={`tab ${!isLogin ? 'active' : ''}`}
            onClick={() => setIsLogin(false)}
          >
            Sign Up
          </button>
        </div>

        {isLogin ? <LoginForm /> : <SignupForm />}
      </motion.div>
    </div>
  );
};

export default Auth;
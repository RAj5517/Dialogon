import { useState } from 'react';
import { motion } from 'framer-motion';
import LoginForm from '../../components/AuthForm/LoginForm';
import SignupForm from '../../components/AuthForm/SignupForm';

const Auth = () => {
  const [isLogin, setIsLogin] = useState(true);

  return (
    <div className="flex justify-center items-center min-h-screen bg-[#1a1a1a] p-4">
      <motion.div 
        className="bg-[#242424] p-10 rounded-2xl w-full max-w-[420px] shadow-lg border border-[#333]"
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
      >
        <div className="text-center mb-8">
          <h1 className="text-[#e0e0e0] text-2xl font-bold mb-2">Meeting Assistant</h1>
          <p className="text-[#888] text-sm">Manage your meetings efficiently</p>
        </div>

        <div className="flex mb-8 bg-[#2a2a2a] p-1 rounded-lg gap-1">
          <button 
            className={`flex-1 py-3 px-3 rounded-md text-sm transition-all duration-300 
            ${isLogin 
              ? 'bg-[#404040] text-[#e0e0e0]' 
              : 'text-[#888] hover:bg-[#333] hover:text-[#aaa]'}`}
            onClick={() => setIsLogin(true)}
          >
            Login
          </button>
          <button 
            className={`flex-1 py-3 px-3 rounded-md text-sm transition-all duration-300 
            ${!isLogin 
              ? 'bg-[#404040] text-[#e0e0e0]' 
              : 'text-[#888] hover:bg-[#333] hover:text-[#aaa]'}`}
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
import { useState } from 'react';
import { motion } from 'framer-motion';
import LoginForm from '../components/AuthForm/LoginForm';
import SignupForm from '../components/AuthForm/SignupForm';
import { auth, provider } from '../utils/firebase';
import { signInWithPopup } from 'firebase/auth';
import { api } from '../utils/api';
import { useNavigate } from 'react-router-dom';
import { LoaderComponent } from '../components/LoaderComponent';

const Auth = () => {
  const [isLogin, setIsLogin] = useState(true);
  const [error, setError] = useState('');
  const [isNavigating, setIsNavigating] = useState(false);
  const navigate = useNavigate();

  const handleGoogleLogin = async () => {
    try {
      // Clear any existing tokens
      await auth.signOut();
      
      console.log("Starting Google sign-in process...");
      const result = await signInWithPopup(auth, provider);
      console.log("Google sign-in successful", result);
      
      const idToken = await result.user.getIdToken(/* forceRefresh */ true);
      console.log("Got fresh ID token");
      
      console.log("Sending token to backend...");
      const response = await api.googleAuth(idToken);
      console.log("Backend response:", response);
      
      if (response.user) {
        console.log("Login successful, storing user data");
        localStorage.setItem('user', JSON.stringify(response.user));
        setIsNavigating(true);
        
        // Wrap navigation in try-catch
        try {
          setTimeout(() => {
            console.log('Navigating to dashboard...');
            navigate('/dashboard');
          }, 2000);
        } catch (navError) {
          console.error('Navigation error:', navError);
          setIsNavigating(false);
        }
      }
    } catch (error) {
      console.error("Authentication Error:", {
        message: error.message,
        code: error.code,
        response: error.response?.data,
        stack: error.stack
      });
      
      if (error.response) {
        // Backend error
        const errorData = error.response.data;
        console.error("Backend Error Details:", errorData);
        
        if (errorData.code === 'token_expired') {
          setError('Session expired. Please try signing in again.');
          await auth.signOut();
        } else {
          setError(errorData.message || "Authentication failed");
        }
      } else if (error.code) {
        // Firebase error
        console.error("Firebase Error:", error.code);
        switch(error.code) {
          case 'auth/popup-closed-by-user':
            setError('Sign-in popup was closed.');
            break;
          case 'auth/cancelled-popup-request':
            setError('Another popup is already open.');
            break;
          default:
            setError(`Authentication error: ${error.message}`);
        }
      } else {
        console.error("Unexpected Error:", error);
        setError('Failed to sign in with Google. Please try again.');
      }
      setIsNavigating(false);
    }
  };

  const handleLogin = async (credentials) => {
    try {
      const response = await api.login(credentials);
      if (response.token) {
        localStorage.setItem('token', response.token);
        localStorage.setItem('user', JSON.stringify(response.user));
        
        // Enhanced transition sequence
        setIsNavigating(true);
        // Wait for animations to complete
        await new Promise(resolve => setTimeout(resolve, 2800));
        navigate('/dashboard');
      }
    } catch (error) {
      console.error('Login error:', error);
      setIsNavigating(false);
    }
  };

  // Debug log for render
  console.log('Current isNavigating state:', isNavigating);

  return (
    <div className="relative">
      {isNavigating && <LoaderComponent />}
      <div 
        className={`transition-all duration-500 ease-in-out transform ${
          isNavigating 
            ? 'opacity-0 scale-95 blur-sm' 
            : 'opacity-100 scale-100 blur-0'
        }`}
      >
        <div className="min-h-screen flex items-center justify-center bg-neutral-900 p-4">
          <motion.div 
            className="w-full max-w-md bg-neutral-800 p-8 rounded-2xl shadow-xl"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.3 }}
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

            {isLogin ? <LoginForm onLogin={handleLogin} /> : <SignupForm />}

            {error && (
              <div className="mt-4 text-red-500 text-sm text-center">
                {error}
              </div>
            )}

            <div className="mt-6">
              <button 
                onClick={handleGoogleLogin}
                className="w-full flex items-center justify-center gap-2 bg-white text-gray-800 py-2 px-4 rounded-lg hover:bg-gray-100 transition-colors"
              >
                <img 
                  src="https://www.gstatic.com/firebasejs/ui/2.0.0/images/auth/google.svg" 
                  alt="Google" 
                  className="w-5 h-5"
                />
                Continue with Google
              </button>
            </div>
          </motion.div>
        </div>
      </div>
    </div>
  );
};

export default Auth;
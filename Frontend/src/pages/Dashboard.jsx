import React from 'react';
import { useNavigate } from 'react-router-dom';

const Dashboard = () => {
  const navigate = useNavigate();

  const handleLogout = () => {
    localStorage.removeItem('token'); // Remove the token from local storage
    navigate('/auth'); // Redirect to the auth page
  };

  return (
    <div className="flex flex-col items-center justify-center min-h-screen bg-[#1a1a1a] p-4">
      <h1 className="text-[#e0e0e0] text-3xl font-bold mb-4">Welcome to the Dashboard!</h1>
      <p className="text-[#888] text-lg mb-6">You are now logged in.</p>
      <button 
        onClick={handleLogout} 
        className="bg-red-500 text-white py-2 px-4 rounded hover:bg-red-600 transition duration-300"
      >
        Logout
      </button>
    </div>
  );
};

export default Dashboard; 
import React from 'react';
import { useSelector } from 'react-redux';
import '../../styles/Auth.css';


const LoadingScreen = () => {
  const loading = useSelector(state => state.auth.loading);

  if (!loading) return null;

  return (
    <div className="loading-overlay">
      <div className="loading-spinner"></div>
      <span className="loading-text">Loading...</span>
    </div>
  );
};

export default LoadingScreen;

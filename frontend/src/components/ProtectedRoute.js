import React from 'react';
import { useSelector } from 'react-redux';
import { Navigate } from 'react-router-dom';

const ProtectedRoute = ({ children }) => {
  const { token, isGuest } = useSelector((state) => state.auth);

  if (!token && !isGuest) {
    // Not logged in and not a guest
    return <Navigate to="/" replace />;
  }

  // Allow if logged in or guest
  return children;
};

export default ProtectedRoute;

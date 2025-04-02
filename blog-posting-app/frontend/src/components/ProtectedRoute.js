import React from 'react';
import { Navigate } from 'react-router-dom';


// This component checks if the user is authenticated before rendering the protected route
// If the user is not authenticated, it redirects them to the login page
const ProtectedRoute = ({ children }) => {
  const token = localStorage.getItem('token'); // Check if the token exists

  if (!token) {
    return <Navigate to="/" />; // Redirect to login if not authenticated
  }

  return children; // Render the protected component
};

export default ProtectedRoute;

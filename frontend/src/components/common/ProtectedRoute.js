import { useSelector } from 'react-redux';
import { Navigate } from 'react-router-dom';

const ProtectedRoute = ({ children }) => {
  const { user, token, isGuest, hydrated } = useSelector((state) => state.auth);

  if (!hydrated) return null; // or a loading spinner

  // Only allow access if authenticated (token) or guest
  if ((!user || !token) && !isGuest) {
    return <Navigate to="/" replace />;
  }

  return children;
};

export default ProtectedRoute;

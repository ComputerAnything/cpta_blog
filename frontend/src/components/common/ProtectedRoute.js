import { useSelector } from 'react-redux';
import { Navigate } from 'react-router-dom';

const ProtectedRoute = ({ children }) => {
  const { user, isGuest, hydrated } = useSelector((state) => state.auth);

  if (!hydrated) return null; // or a loading spinner

  if (!user && !isGuest) {
    return <Navigate to="/" replace />;
  }

  return children;
};

export default ProtectedRoute;

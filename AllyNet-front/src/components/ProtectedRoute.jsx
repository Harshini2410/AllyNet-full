import { Navigate, useLocation } from 'react-router-dom';
import { useAuthStore } from '../store/useAuthStore';

const ProtectedRoute = ({ children }) => {
  const accessToken = useAuthStore((state) => state.accessToken);
  const location = useLocation();
  const isAuthenticated = Boolean(accessToken);

  // Only redirect to login if not authenticated
  // Don't redirect if we're already on a protected route and have a token
  if (!isAuthenticated) {
    // Use location.state to preserve the attempted location for redirect after login
    return <Navigate to="/auth/login" state={{ from: location }} replace />;
  }

  return children;
};

export default ProtectedRoute;


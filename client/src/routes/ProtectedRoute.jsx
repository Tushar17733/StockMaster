import { Navigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { PageLoader } from '../components/UI/Loader';

export const ProtectedRoute = ({ children, requiredRole = null }) => {
  const { isAuthenticated, loading, hasRole } = useAuth();

  if (loading) {
    return <PageLoader />;
  }

  if (!isAuthenticated()) {
    return <Navigate to="/auth/login" replace />;
  }

  if (requiredRole && !hasRole(requiredRole)) {
    return <Navigate to="/dashboard" replace />;
  }

  return children;
};


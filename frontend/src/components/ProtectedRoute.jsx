import { Navigate } from 'react-router-dom';
import { useStore } from '../store';

function ProtectedRoute({ children }) {
  const { isAdminAuthenticated } = useStore();

  if (!isAdminAuthenticated()) {
    return <Navigate to="/admin/login" replace />;
  }

  return children;
}

export default ProtectedRoute;
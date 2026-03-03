import { Navigate } from 'react-router-dom';
import { useStore } from '../store';

function AdminRoute({ children }) {
  const isAdmin = useStore(state => state.isAdmin);

  if (!isAdmin) {
    return <Navigate to="/admin/login" replace />;
  }

  return children;
}

export default AdminRoute;

import { Navigate } from 'react-router-dom';

export const AdminRoute = ({ children, user }) => {
  if (!user) {
    return <Navigate to="/" replace />;
  }

  if (user.role !== 'admin') {
    return <Navigate to="/" replace />;
  }

  return children;
};

export default AdminRoute;
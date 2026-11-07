import { Navigate, Outlet, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { dashboardPath } from '../utils/constants';
import Spinner from './Spinner';

// Wrap routes: <Route element={<ProtectedRoute roles={['club']} />}>...</Route>
// - not logged in -> /login (and back here afterwards)
// - wrong role    -> the user's own dashboard
export default function ProtectedRoute({ roles }) {
  const { user, loading } = useAuth();
  const location = useLocation();
  if (loading) return <Spinner className="min-h-screen" />;
  if (!user) return <Navigate to="/login" state={{ from: location.pathname + location.search }} replace />;
  if (roles && !roles.includes(user.role)) return <Navigate to={dashboardPath(user.role)} replace />;
  return <Outlet />;
}

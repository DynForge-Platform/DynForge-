import { Navigate, Outlet, useLocation } from 'react-router';
import { useAuth, type AuthRole } from '../context/AuthContext';

function loginRedirect(pathname: string, search: string): string {
  const target = encodeURIComponent(pathname + search);
  return `/login?redirect=${target}`;
}

/**
 * Requires an authenticated user. Unauthenticated visitors are sent to /login
 * with a `redirect` back to the page they attempted to reach.
 */
export function ProtectedRoute() {
  const { user } = useAuth();
  const location = useLocation();

  if (!user) {
    return <Navigate to={loginRedirect(location.pathname, location.search)} replace />;
  }
  return <Outlet />;
}

/**
 * Requires an authenticated user whose role is in `allow`. Unauthenticated
 * visitors go to /login; authenticated users with the wrong role get /403.
 */
export function RoleRoute({ allow }: { allow: AuthRole[] }) {
  const { user } = useAuth();
  const location = useLocation();

  if (!user) {
    return <Navigate to={loginRedirect(location.pathname, location.search)} replace />;
  }
  if (!allow.includes(user.role)) {
    return <Navigate to="/403" replace />;
  }
  return <Outlet />;
}

import PropTypes from 'prop-types';
import { Navigate } from 'react-router-dom';
import { useAuth } from '@/auth/useAuth';

/**
 * Guard de rôle — redirige vers / si le rôle de l'utilisateur
 * ne figure pas dans la liste autorisée.
 */
export default function RequireRole({ roles, children }) {
  const { user, loading } = useAuth();

  if (loading) return null;
  if (!user || !roles.includes(user.role)) {
    return <Navigate to="/" replace />;
  }

  return children;
}

RequireRole.propTypes = {
  roles: PropTypes.arrayOf(PropTypes.string).isRequired,
  children: PropTypes.node.isRequired,
};

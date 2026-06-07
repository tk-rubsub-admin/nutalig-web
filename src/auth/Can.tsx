import { ReactElement, ReactNode } from 'react';
import { useAuth } from './AuthContext';

interface CanProps {
  permission?: string;
  anyPermission?: string[];
  fallback?: ReactNode;
  children: ReactNode;
}

export default function Can({
  permission,
  anyPermission,
  fallback = null,
  children
}: CanProps): ReactElement | null {
  const { hasPermission, hasAnyPermission } = useAuth();
  const allowed =
    (permission ? hasPermission(permission) : true) &&
    (anyPermission?.length ? hasAnyPermission(anyPermission) : true);

  return <>{allowed ? children : fallback}</>;
}

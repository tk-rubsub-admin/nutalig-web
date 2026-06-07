import { ReactElement, Fragment } from 'react';
import { useLocation } from 'react-router-dom';
import { hasAllowedRole } from 'auth/roles';
import { useAuth } from 'auth/AuthContext';
import { SidebarItemsType } from './types';
import reduceChildRoutes from './reduceChildRoutes';

interface SidebarNavListProps {
  depth: number;
  pages: SidebarItemsType[];
  onClick: () => void;
}

function SidebarNavList({ pages, depth, onClick }: SidebarNavListProps): ReactElement {
  const router = useLocation();
  const { getRole, getPermission } = useAuth();
  const currentRoute = router.pathname;
  const currentUserRole = getRole();
  const userPermissions = getPermission();

  const canAccessPage = (page: SidebarItemsType) => {
    // Permission is the primary authorization source. Role remains as migration fallback.
    if (page.allowedPermission) {
      return page.allowedPermission.some((p) => userPermissions.includes(p));
    }

    if (page.allowedRoles) {
      return hasAllowedRole(currentUserRole, page.allowedRoles);
    }

    return true;
  };

  const filteredPages = pages.filter(canAccessPage);

  const childRoutes = filteredPages.reduce(
    (items, page) =>
      reduceChildRoutes({
        items,
        page,
        currentRoute,
        depth,
        onClick
      }),
    [] as JSX.Element[]
  );

  return <Fragment>{childRoutes}</Fragment>;
}

export default SidebarNavList;

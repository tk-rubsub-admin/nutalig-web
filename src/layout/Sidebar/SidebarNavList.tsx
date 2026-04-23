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
    // 1. เช็ค Role
    if (page.allowedRoles) {
      return hasAllowedRole(currentUserRole, page.allowedRoles);
    }

    // 2. เช็ค Permission
    if (page.allowedPermission) {
      return page.allowedPermission.some((p) => userPermissions.includes(p));
    }

    // 3. ไม่กำหนดอะไร = เข้าถึงได้
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

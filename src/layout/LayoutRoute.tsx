import React, { ComponentType, useState } from 'react';
import { Route, Redirect, RouteComponentProps } from 'react-router-dom';
import styled from 'styled-components';
import { useAuth } from 'auth/AuthContext';
import { Role, hasAllowedRole } from 'auth/roles';
import { ROUTE_PATHS } from 'routes';
import Sidebar from './Sidebar';
import Navbar from './Navbar';
import ls from 'localstorage-slim';

export const Page = styled.div`
  width: 100%;
`;

const Main = styled.main<{ $isPublic?: boolean; open?: boolean }>`
  display: flex;
  flex: 1 1 auto;
  padding: 20px;
  height: ${({ $isPublic }) => ($isPublic ? '100vh' : '100%')};
  margin-left: ${({ theme, $isPublic, open }) => ($isPublic || !open ? 0 : theme.size.sidebar)};
  ${({ theme }) => theme.breakpoints.down('md')} {
    margin-left: 0;
  }
`;

export interface LayoutRouteProps {
  component: ComponentType;
  exact?: boolean;
  isPublic?: boolean;
  path: string;
  allowedRoles?: Role[];
  requiredPermissions?: string[];
}

interface AuthenticatedRouteProps extends LayoutRouteProps {
  isSidebarOpen: boolean;
  handleSidebarOpen: (state?: boolean) => void;
}

const hasRequiredPermissions = (
  userPermissions: string[],
  requiredPermissions?: string[]
): boolean => {
  if (!requiredPermissions || requiredPermissions.length === 0) return true;
  return requiredPermissions.every((p) => userPermissions.includes(p));
};

function PublicRoute({
  component: Component,
  exact,
  path
}: Partial<LayoutRouteProps>): JSX.Element {
  return (
    <Route
      exact={exact}
      path={path}
      render={(props) => (
        <Main $isPublic>
          {/* @ts-expect-error */}
          <Component {...props} />
        </Main>
      )}
    />
  );
}

function PrivateRoute({
  component: Component,
  exact,
  path,
  isSidebarOpen,
  handleSidebarOpen,
  allowedRoles,
  requiredPermissions
}: AuthenticatedRouteProps): JSX.Element {
  const { getToken, getRole, getPermission } = useAuth();
  const isAuthenticated = !!getToken();

  const role = getRole();
  const permissions = getPermission?.() || [];

  const render = (props: RouteComponentProps): React.ReactNode => {
    if (!isAuthenticated) {
      return <Redirect to={{ pathname: ROUTE_PATHS.LOGIN, state: { from: props.location } }} />;
    }

    // ✅ permission-first
    if (requiredPermissions && requiredPermissions.length > 0) {
      if (!hasRequiredPermissions(permissions, requiredPermissions)) {
        return <Redirect to={{ pathname: ROUTE_PATHS.FORBIDDEN }} />;
      }
    } else {
      // ✅ fallback role
      if (!hasAllowedRole(role, allowedRoles)) {
        return <Redirect to={{ pathname: ROUTE_PATHS.FORBIDDEN }} />;
      }
    }

    return (
      <>
        <Navbar onSidebarToggle={handleSidebarOpen} />
        <Sidebar isOpen={isSidebarOpen} onSidebarToggle={handleSidebarOpen} />
        <Main open={isSidebarOpen}>
          {/* @ts-expect-error */}
          <Component {...props} />
        </Main>
      </>
    );
  };

  return <Route exact={exact} path={path} render={render} />;
}

export default function LayoutRoute(props: LayoutRouteProps): JSX.Element {
  const {
    component: Component,
    exact = true,
    path,
    isPublic,
    allowedRoles,
    requiredPermissions = []
  } = props;

  const [isSidebarOpen, setIsSidebarOpen] = useState<boolean>(ls.get('SIDEBAR_TOGGLE') || false);

  function handleSidebarOpen(state = !isSidebarOpen) {
    ls.set<boolean>('SIDEBAR_TOGGLE', state);
    setIsSidebarOpen(state);
  }

  if (isPublic) {
    return <PublicRoute component={Component} exact={exact} path={path} />;
  }

  return (
    <PrivateRoute
      component={Component}
      exact={exact}
      path={path}
      isSidebarOpen={isSidebarOpen}
      handleSidebarOpen={handleSidebarOpen}
      allowedRoles={allowedRoles}
      requiredPermissions={requiredPermissions}
    />
  );
}

// src/auth/AuthContext.tsx

import React, { ReactElement, createContext, useContext, useEffect, useState } from 'react';
import ls from 'localstorage-slim';
import { useTranslation } from 'react-i18next';
import { mergePermissions } from './permissions';
import { getAdminUserRoleLabel } from './roles';
import {
  getUserProfile,
  lineLogin as lineLoginApi,
  lineRegister as lineRegisterApi,
  login,
  logout,
  oneTimeLogin
} from 'services/general-api';
import { LineLoginRequest, LineRegisterRequest, LoginResponse, Role } from 'services/User/user-type';

export const STORAGE_KEYS = {
  ROLE: 'nutalig:user_role',
  PERMISSIONS: 'nutalig:permission',
  STAFF_ROLE: 'nutalig:staff_role',
  STAFF_ID: 'nutalig:staff_id',
  SALES_ID: 'nutalig:sales_id',
  EMPLOYEE_ID: 'nutalig:employee_id',
  TOKEN: 'nutalig:user_token',
  ID: 'nutalig:user_id',
  ACCOUNT: 'nutalig:account',
  USERNAME: 'nutalig:username',
  COMPANY: 'nutalig:company',
  LOGO: 'nutalig:logo',
  ADVANCE_DAYS: 'advance_days',
};

interface AuthProviderProps {
  children: ReactElement;
}

interface AuthProps {
  logInWithEmailAndPassword: (email: string, password: string) => Promise<string>;
  logInWithGoogle: () => Promise<void>;
  logInWithOneTimeToken: (token: string) => Promise<string>;
  lineLogin: (req: LineLoginRequest) => Promise<LoginResponse>;
  lineRegister: (req: LineRegisterRequest) => Promise<LoginResponse>;
  logOut: () => Promise<void>;

  setToken: (token: string) => void;
  getToken: () => string;
  refreshPersistentToken: () => Promise<void>;

  setRole: (role: Role | string) => void;
  getRole: () => string;

  setPermission: (perm: string[]) => void;
  getPermission: () => string[];

  setStaffRole: (role: string) => void;
  getStaffRole: () => string;

  setStaffId: (id: string) => void;
  getStaffId: () => string;

  setSalesId: (id: string) => void;
  getSalesId: () => string;

  setEmployeeId: (id: string) => void;
  getEmployeeId: () => string;

  getRoleDisplayName: () => string;

  setUserId: (id: string) => void;
  getUserId: () => string;

  setUsername: (username: string) => void;
  getUsername: () => string;

  setAdvanceSODays: (days: string) => void;
  getAdvanceSODays: () => number;

  // ✅ เพิ่มตัวนี้
  authReady: boolean;
  refreshUserProfile: () => Promise<string>;
  hasPermission: (permission: string) => boolean;
  hasAnyPermission: (permissions: string[]) => boolean;
}

const Auth = createContext<AuthProps>({
  logInWithEmailAndPassword: async () => '',
  logInWithGoogle: async () => undefined,
  logInWithOneTimeToken: async () => '',
  lineLogin: async () => ({ status: '', data: { token: '' } }),
  lineRegister: async () => ({ status: '', data: { token: '' } }),
  logOut: async () => undefined,

  setToken: () => undefined,
  getToken: () => '',
  refreshPersistentToken: async () => undefined,

  setRole: () => undefined,
  getRole: () => '',

  setPermission: () => undefined,
  getPermission: () => [],

  setStaffRole: () => undefined,
  getStaffRole: () => '',

  setStaffId: () => undefined,
  getStaffId: () => '',

  setSalesId: () => undefined,
  getSalesId: () => '',

  setEmployeeId: () => undefined,
  getEmployeeId: () => '',

  getRoleDisplayName: () => '',

  setUserId: () => undefined,
  getUserId: () => '',

  setUsername: () => undefined,
  getUsername: () => '',

  setAdvanceSODays: () => undefined,
  getAdvanceSODays: () => 0,

  authReady: false,
  refreshUserProfile: async () => '',
  hasPermission: () => false,
  hasAnyPermission: () => false
});

export function AuthProvider({ children }: AuthProviderProps): JSX.Element {
  const { t } = useTranslation();

  const [authReady, setAuthReady] = useState(false);
  const [tokenState, setTokenState] = useState(() => ls.get<string>(STORAGE_KEYS.TOKEN) || '');
  const [userIdState, setUserIdState] = useState(() => ls.get<string>(STORAGE_KEYS.ID) || '');
  const [roleState, setRoleState] = useState(() => ls.get<string>(STORAGE_KEYS.ROLE) || '');
  const [permissionState, setPermissionState] = useState<string[]>(() => ls.get<string[]>(STORAGE_KEYS.PERMISSIONS) || []);
  const [employeeIdState, setEmployeeIdState] = useState(() => ls.get<string>(STORAGE_KEYS.EMPLOYEE_ID) || '');
  const [salesIdState, setSalesIdState] = useState(() => ls.get<string>(STORAGE_KEYS.SALES_ID) || '');
  const [usernameState, setUsernameState] = useState(() => ls.get<string>(STORAGE_KEYS.USERNAME) || '');
  const [staffRoleState, setStaffRoleState] = useState(() => ls.get<string>(STORAGE_KEYS.STAFF_ROLE) || '');
  const [staffIdState, setStaffIdState] = useState(() => ls.get<string>(STORAGE_KEYS.STAFF_ID) || '');

  useEffect(() => {
    if (!tokenState) {
      setAuthReady(true);
      return;
    }

    hydrateUserProfileFromBackend()
      .catch(() => undefined)
      .finally(() => setAuthReady(true));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    const refresh = () => {
      if (!getToken()) return;
      hydrateUserProfileFromBackend().catch(() => undefined);
    };

    window.addEventListener('nutalig:authorization-stale', refresh);
    window.addEventListener('focus', refresh);

    return () => {
      window.removeEventListener('nutalig:authorization-stale', refresh);
      window.removeEventListener('focus', refresh);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [tokenState]);

  const setToken = (token: string) => {
    ls.set<string>(STORAGE_KEYS.TOKEN, token);
    setTokenState(token);
  };

  const getToken = (): string => {
    return tokenState || ls.get<string>(STORAGE_KEYS.TOKEN) || '';
  };

  const refreshPersistentToken = async (): Promise<void> => {
    await hydrateUserProfileFromBackend();
  };

  const setUserId = (id: string) => {
    ls.set<string>(STORAGE_KEYS.ID, id);
    setUserIdState(id);
  };

  const getUserId = (): string => {
    return userIdState || ls.get<string>(STORAGE_KEYS.ID) || '';
  };

  const setRole = (role: string | Role) => {
    const roleCode = typeof role === 'string' ? role : role.roleCode;
    ls.set<string>(STORAGE_KEYS.ROLE, roleCode);
    setRoleState(roleCode);
  };

  const getRole = (): string => {
    return roleState || ls.get<string>(STORAGE_KEYS.ROLE) || '';
  };

  const clearRoleAndPermissions = () => {
    ls.remove(STORAGE_KEYS.ROLE);
    ls.remove(STORAGE_KEYS.PERMISSIONS);
    setRoleState('');
    setPermissionState([]);
  };

  const setPermission = (perm: string[]) => {
    ls.set<string[]>(STORAGE_KEYS.PERMISSIONS, perm);
    setPermissionState(perm);
  };

  const getPermission = (): string[] => {
    return permissionState.length ? permissionState : ls.get<string[]>(STORAGE_KEYS.PERMISSIONS) || [];
  };

  const setStaffRole = (role: string) => {
    ls.set<string>(STORAGE_KEYS.STAFF_ROLE, role);
    setStaffRoleState(role);
  };

  const getStaffRole = (): string => {
    return staffRoleState || ls.get<string>(STORAGE_KEYS.STAFF_ROLE) || '';
  };

  const setStaffId = (id: string) => {
    ls.set<string>(STORAGE_KEYS.STAFF_ID, id);
    setStaffIdState(id);
  };

  const getStaffId = (): string => {
    return staffIdState || ls.get<string>(STORAGE_KEYS.STAFF_ID) || '';
  };

  const setSalesId = (id: string) => {
    ls.set<string>(STORAGE_KEYS.SALES_ID, id);
    setSalesIdState(id);
  };

  const getSalesId = (): string => {
    return salesIdState || ls.get<string>(STORAGE_KEYS.SALES_ID) || '';
  };

  const setEmployeeId = (id: string) => {
    ls.set<string>(STORAGE_KEYS.EMPLOYEE_ID, id);
    setEmployeeIdState(id);
  };

  const getEmployeeId = (): string => {
    return employeeIdState || ls.get<string>(STORAGE_KEYS.EMPLOYEE_ID) || '';
  };

  const setUsername = (username: string) => {
    ls.set<string>(STORAGE_KEYS.USERNAME, username);
    setUsernameState(username);
  };

  const getUsername = (): string => {
    return usernameState || ls.get<string>(STORAGE_KEYS.USERNAME) || '';
  };

  const setAdvanceSODays = (days: string) => {
    ls.set<number>(STORAGE_KEYS.ADVANCE_DAYS, Number(days));
  }

  const getAdvanceSODays = (): number => {
    return ls.get<string>(STORAGE_KEYS.ADVANCE_DAYS) || 0;
  }

  const getRoleDisplayName = (): string => {
    const role = getRole();
    return getAdminUserRoleLabel(role, t);
  };

  const logInWithEmailAndPassword = async (email: string, password: string): Promise<string> => {
    void email;
    void password;
    throw new Error('Email/password login is no longer handled by Firebase');
  };

  const logInWithGoogle = async (): Promise<void> => {
    throw new Error('Google login is no longer handled by Firebase');
  };

  const logInWithOneTimeToken = async (oneTimeToken: string): Promise<string> => {
    const response = await oneTimeLogin(oneTimeToken);
    const token =
      typeof response === 'string'
        ? response
        : typeof response?.data?.token === 'string'
          ? response.data.token
          : '';

    if (!token) {
      throw new Error('One-time login token is invalid');
    }

    setToken(token);

    const roleCode = await hydrateUserProfileFromBackend();

    return roleCode;
  };

  const lineLogin = async (req: LineLoginRequest): Promise<LoginResponse> => {
    const response = await lineLoginApi(req);
    const token =
      typeof response?.data?.token === 'string'
        ? response.data.token
        : typeof (response as any)?.data?.accessToken === 'string'
          ? (response as any).data.accessToken
          : typeof (response as any)?.token === 'string'
            ? (response as any).token
            : '';

    if (token) {
      setToken(token);
      await hydrateUserProfileFromBackend();
    }

    return response;
  };

  const lineRegister = async (req: LineRegisterRequest): Promise<LoginResponse> => {
    const response = await lineRegisterApi(req);
    const token =
      typeof response?.data?.token === 'string'
        ? response.data.token
        : typeof (response as any)?.data?.accessToken === 'string'
          ? (response as any).data.accessToken
          : typeof (response as any)?.token === 'string'
            ? (response as any).token
            : '';

    if (token) {
      setToken(token);
      await hydrateUserProfileFromBackend();
    }

    return response;
  };

  const logOut = async (): Promise<void> => {
    try {
      const uid = getUserId();
      if (uid) {
        await logout({ userId: uid });
      }
    } finally {
      ls.clear();
      setTokenState('');
      setUserIdState('');
      setRoleState('');
      setPermissionState([]);
      setEmployeeIdState('');
      setSalesIdState('');
      setUsernameState('');
      setStaffRoleState('');
      setStaffIdState('');
    }
  };

  async function hydrateUserProfileFromBackend(): Promise<string> {

    const userProfile = await getUserProfile();
    await login({ userId: userProfile.id });

    setUserId(userProfile.id);
    setRole(userProfile.role.roleCode);
    setUsername(userProfile.username);
    // setPermission(mergePermissions(userProfile.role.roleCode, userProfile.permissions));
    setPermission(userProfile.permissions);
    if (userProfile.employeeId) {
      setEmployeeId(userProfile.employeeId);
    } else {
      ls.remove(STORAGE_KEYS.EMPLOYEE_ID);
      setEmployeeIdState('');
    }
    if (userProfile.salesId) {
      setSalesId(userProfile.salesId);
    } else {
      ls.remove(STORAGE_KEYS.SALES_ID);
      setSalesIdState('');
    }

    // return role ไว้ใช้ต่อ
    return userProfile.role.roleCode;
  };

  const hasPermission = (permission: string): boolean => getPermission().includes(permission);
  const hasAnyPermission = (permissions: string[]): boolean =>
    permissions.some((permission) => hasPermission(permission));

  return (
    <Auth.Provider
      value={{
        logInWithEmailAndPassword,
        logInWithGoogle,
        logInWithOneTimeToken,
        lineLogin,
        lineRegister,
        logOut,

        setToken,
        getToken,
        refreshPersistentToken,

        setRole,
        getRole,

        setPermission,
        getPermission,

        setStaffRole,
        getStaffRole,

        setStaffId,
        getStaffId,

        setSalesId,
        getSalesId,

        setEmployeeId,
        getEmployeeId,

        getRoleDisplayName,

        setUserId,
        getUserId,

        setUsername,
        getUsername,

        setAdvanceSODays,
        getAdvanceSODays,
        authReady,
        refreshUserProfile: hydrateUserProfileFromBackend,
        hasPermission,
        hasAnyPermission
      }}>
      {children}
    </Auth.Provider>
  );
}


export const useAuth = (): AuthProps => useContext<AuthProps>(Auth);

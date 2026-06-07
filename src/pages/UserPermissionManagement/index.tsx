import {
  Box,
  Button,
  Checkbox,
  Chip,
  CircularProgress,
  Stack,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Typography
} from '@mui/material';
import { makeStyles } from '@mui/styles';
import ConfirmDialog from 'components/ConfirmDialog';
import LoadingDialog from 'components/LoadingDialog';
import PageTitle from 'components/PageTitle';
import { Wrapper } from 'components/Styled';
import { Page } from 'layout/LayoutRoute';
import { useEffect, useMemo, useState } from 'react';
import toast from 'react-hot-toast';
import { useTranslation } from 'react-i18next';
import { useQuery } from 'react-query';
import { getAllRolePermissions, updateRolePermissions } from 'services/User/user-api';
import { Permission, RolePermission } from 'services/User/user-type';

interface PermissionRow extends Permission {
  roleCodes: string[];
}

interface PermissionGroup {
  group: string;
  permissions: PermissionRow[];
}

type RolePermissionMap = Record<string, Record<string, boolean>>;

const useStyles = makeStyles({
  tableContainer: {
    maxHeight: 'calc(100vh - 190px)'
  },
  permissionHeaderCell: {
    minWidth: 320,
    left: 0,
    zIndex: 4,
    position: 'sticky',
    background: '#ffffff',
    borderRight: '1px solid #e0e0e0'
  },
  permissionCell: {
    minWidth: 320,
    left: 0,
    zIndex: 2,
    position: 'sticky',
    background: '#ffffff',
    borderRight: '1px solid #e0e0e0'
  },
  roleHeaderCell: {
    minWidth: 150,
    whiteSpace: 'nowrap',
    textAlign: 'center'
  },
  roleCell: {
    textAlign: 'center'
  },
  groupCell: {
    textAlign: 'left',
    background: '#f5f5f5'
  },
  noResultMessage: {
    textAlign: 'center',
    fontSize: '1.1em',
    fontWeight: 700,
    padding: '48px 0'
  }
});

const resolvePermissionName = (permission: Permission): string => {
  const name = permission.nameTh || permission.nameEn;
  return name ? `${name} (${permission.code})` : permission.code;
};

const resolveRoleName = (role: RolePermission): string => role.roleNameTh || role.roleNameEn || role.roleCode;

const buildPermissionRows = (roles: RolePermission[]): PermissionRow[] => {
  const permissionByCode: Record<string, PermissionRow> = {};

  roles.forEach((role) => {
    role.permissions.forEach((permission) => {
      if (!permissionByCode[permission.code]) {
        permissionByCode[permission.code] = {
          ...permission,
          roleCodes: []
        };
      }

      permissionByCode[permission.code].roleCodes.push(role.roleCode);
    });
  });

  return Object.values(permissionByCode).sort((a, b) => {
    const groupCompare = (a.group || '').localeCompare(b.group || '');
    return groupCompare || a.code.localeCompare(b.code);
  });
};

const buildPermissionGroups = (roles: RolePermission[]): PermissionGroup[] => {
  const rows = buildPermissionRows(roles);
  const permissionsByGroup: Record<string, PermissionRow[]> = {};

  rows.forEach((permission) => {
    const group = permission.group || 'ungrouped';

    if (!permissionsByGroup[group]) {
      permissionsByGroup[group] = [];
    }

    permissionsByGroup[group].push(permission);
  });

  return Object.entries(permissionsByGroup)
    .sort(([groupA], [groupB]) => groupA.localeCompare(groupB))
    .map(([group, permissions]) => ({
      group,
      permissions
    }));
};

const buildRolePermissionMap = (roles: RolePermission[]): RolePermissionMap => {
  const permissionCodes = Array.from(
    new Set(roles.flatMap((role) => role.permissions.map((permission) => permission.code)))
  );

  return roles.reduce<RolePermissionMap>((acc, role) => {
    acc[role.roleCode] = permissionCodes.reduce<Record<string, boolean>>((permissionAcc, permissionCode) => {
      permissionAcc[permissionCode] = role.permissions.some((permission) => permission.code === permissionCode);
      return permissionAcc;
    }, {});

    return acc;
  }, {});
};

const normalizePermissionMap = (map: RolePermissionMap): Record<string, Record<string, boolean>> =>
  Object.keys(map)
    .sort()
    .reduce<Record<string, Record<string, boolean>>>((acc, roleCode) => {
      acc[roleCode] = Object.keys(map[roleCode] || {})
        .sort()
        .reduce<Record<string, boolean>>((permissionAcc, permissionCode) => {
          permissionAcc[permissionCode] = !!map[roleCode][permissionCode];
          return permissionAcc;
        }, {});

      return acc;
    }, {});

const isSamePermissionMap = (a: RolePermissionMap, b: RolePermissionMap): boolean =>
  JSON.stringify(normalizePermissionMap(a)) === JSON.stringify(normalizePermissionMap(b));

const isPermissionEditable = (permission: Permission): boolean => permission.group !== 'account';

export default function UserPermissionManagement(): JSX.Element {
  const classes = useStyles();
  const { t } = useTranslation();
  const [initialPermissionMap, setInitialPermissionMap] = useState<RolePermissionMap>({});
  const [permissionMap, setPermissionMap] = useState<RolePermissionMap>({});
  const [confirmDialogOpen, setConfirmDialogOpen] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const {
    data: roles = [],
    isFetching,
    isError
  } = useQuery(['role-permission-list'], () => getAllRolePermissions(), {
    refetchOnWindowFocus: false
  });

  const permissionGroups = useMemo(() => buildPermissionGroups(roles), [roles]);
  const permissionCount = permissionGroups.reduce(
    (total, group) => total + group.permissions.length,
    0
  );
  const resolveGroupName = (group: string): string =>
    t(`permissionManagement.group.${group}`, group);
  const hasPermissionChange = !isSamePermissionMap(initialPermissionMap, permissionMap);

  useEffect(() => {
    const nextPermissionMap = buildRolePermissionMap(roles);
    setInitialPermissionMap(nextPermissionMap);
    setPermissionMap(nextPermissionMap);
  }, [roles]);

  const togglePermission = (roleCode: string, permission: Permission) => {
    if (!isPermissionEditable(permission)) {
      return;
    }

    const permissionCode = permission.code;
    setPermissionMap((prev) => {
      const nextRolePermissions = { ...(prev[roleCode] || {}) };
      nextRolePermissions[permissionCode] = !nextRolePermissions[permissionCode];

      return {
        ...prev,
        [roleCode]: nextRolePermissions
      };
    });
  };
  const clearPermissions = () => {
    setPermissionMap(
      roles.reduce<RolePermissionMap>((acc, role) => {
        acc[role.roleCode] = Object.keys(permissionMap[role.roleCode] || {}).reduce<Record<string, boolean>>(
          (permissionAcc, permissionCode) => {
            permissionAcc[permissionCode] = false;
            return permissionAcc;
          },
          {}
        );
        return acc;
      }, {})
    );
  };
  const resetPermissions = () => {
    setPermissionMap(initialPermissionMap);
  };
  const savePermissions = async () => {
    setIsSaving(true);
    setConfirmDialogOpen(false);

    try {
      await toast.promise(updateRolePermissions(permissionMap), {
        loading: t('toast.loading'),
        success: t('toast.success'),
        error: (error) => t('toast.failed') + ' ' + (error?.response?.data?.message || error.message)
      });
      setInitialPermissionMap(permissionMap);
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <Page>
      <PageTitle title={t('permissionManagement.title')} />
      <Wrapper>
        <Stack
          direction={{ xs: 'column', sm: 'row' }}
          justifyContent="space-between"
          spacing={2}
          mb={2}>
          <Box />
          <Stack direction="row" spacing={1} justifyContent={{ xs: 'flex-start', sm: 'flex-end' }}>
            <Button
              variant="contained"
              className="btn-amber-orange"
              disabled={!hasPermissionChange || isSaving}
              onClick={resetPermissions}>
              {t('button.clear')}
            </Button>
            {hasPermissionChange ? (
              <Button
                variant="contained"
                className="btn-emerald-green"
                disabled={isSaving}
                onClick={() => setConfirmDialogOpen(true)}>
                {t('button.save')}
              </Button>
            ) : null}
          </Stack>
        </Stack>

        <TableContainer className={classes.tableContainer}>
          <Table stickyHeader size="small" id="role_permission___table">
            <TableHead>
              <TableRow>
                <TableCell className={classes.permissionHeaderCell} />
                {roles.map((role) => (
                  <TableCell key={role.roleCode} className={classes.roleHeaderCell}>
                    <Typography variant="subtitle2">{resolveRoleName(role)}</Typography>
                    <Typography variant="caption" color="textSecondary">
                      {role.roleCode}
                    </Typography>
                  </TableCell>
                ))}
              </TableRow>
            </TableHead>
            <TableBody>
              {isFetching ? (
                <TableRow>
                  <TableCell colSpan={roles.length + 1} align="center">
                    <CircularProgress />
                  </TableCell>
                </TableRow>
              ) : isError ? (
                <TableRow>
                  <TableCell colSpan={roles.length + 1}>
                    <div className={classes.noResultMessage}>
                      {t('permissionManagement.loadFailed')}
                    </div>
                  </TableCell>
                </TableRow>
              ) : permissionCount === 0 ? (
                <TableRow>
                  <TableCell colSpan={roles.length + 1}>
                    <div className={classes.noResultMessage}>
                      {t('permissionManagement.noData')}
                    </div>
                  </TableCell>
                </TableRow>
              ) : (
                permissionGroups.flatMap((group) => [
                  <TableRow key={`${group.group}-header`}>
                    <TableCell colSpan={roles.length + 1} className={classes.groupCell}>
                      <Chip size="small" color="primary" label={resolveGroupName(group.group)} />
                    </TableCell>
                  </TableRow>,
                  ...group.permissions.map((permission) => (
                    <TableRow hover key={permission.code}>
                      <TableCell className={classes.permissionCell}>
                        <Typography variant="body2">{resolvePermissionName(permission)}</Typography>
                      </TableCell>
                      {roles.map((role) => {
                        return (
                          <TableCell key={`${permission.code}-${role.roleCode}`} className={classes.roleCell}>
                            <Checkbox
                              color="primary"
                              disabled={!isPermissionEditable(permission)}
                              checked={!!permissionMap[role.roleCode]?.[permission.code]}
                              onChange={() => togglePermission(role.roleCode, permission)}
                            />
                          </TableCell>
                        );
                      })}
                    </TableRow>
                  ))
                ])
              )}
            </TableBody>
          </Table>
        </TableContainer>
      </Wrapper>
      <ConfirmDialog
        open={confirmDialogOpen}
        title={t('permissionManagement.confirmSaveTitle')}
        message={t('permissionManagement.confirmSaveMessage')}
        confirmText={t('button.confirm')}
        cancelText={t('button.cancel')}
        isShowCancelButton={true}
        isShowConfirmButton={true}
        onConfirm={() => {
          void savePermissions();
        }}
        onCancel={() => setConfirmDialogOpen(false)}
      />
      <LoadingDialog open={isSaving} />
    </Page>
  );
}

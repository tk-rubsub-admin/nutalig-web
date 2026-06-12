import {
  ArrowBackIos,
  Cancel,
  ContentCopy,
  Edit,
  LinkOff,
  PersonAdd,
  Save
} from '@mui/icons-material';
import { Avatar, Button, Chip, Grid, MenuItem, Stack, TextField, Typography } from '@mui/material';
import AddNewAdminDialog from 'pages/AdminManagement/AddNewAdminDialog';
import ConfirmDialog from 'components/ConfirmDialog';
import PageTitle from 'components/PageTitle';
import LoadingDialog from 'components/LoadingDialog';
import { GridTextField, Wrapper } from 'components/Styled';
import { useFormik } from 'formik';
import { Page } from 'layout/LayoutRoute';
import { useMemo, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { useQuery } from 'react-query';
import { useHistory, useParams } from 'react-router-dom';
import { ROUTE_PATHS } from 'routes';
import { getSystemConfig } from 'services/Config/config-api';
import { getEmployee, updateEmployee } from 'services/Employee/employee-api';
import { EmployeeRecord, UpdateEmployeeRequest } from 'services/Employee/employee-type';
import { inviteLineRegistration, resetLineBinding } from 'services/User/user-api';
import { copyText } from 'utils/copyContent';
import toast from 'react-hot-toast';
import * as Yup from 'yup';
import { PERMISSIONS } from 'auth/permissions';
import Can from 'auth/Can';

interface EmployeeDetailParam {
  id: string;
}

function getEmployeeName(employee?: EmployeeRecord): string {
  if (!employee) {
    return '';
  }

  return [employee.firstNameTh, employee.lastNameTh].filter(Boolean).join(' ').trim() || '-';
}

function getStatusColor(status?: string): 'success' | 'default' {
  return status === 'ACTIVE' ? 'success' : 'default';
}

function getUserRoleDisplay(user?: EmployeeRecord['userDto'] | null): string {
  const role = user?.role;
  if (!role) {
    return '-';
  }
  return `${role.roleNameTh || role.roleNameEn || role.roleCode} (${role.roleCode})`;
}

function resolveInviteLink(response: any): string {
  const inviteUrl = response?.data?.inviteUrl || response?.data?.registrationUrl || response?.data?.url;

  if (typeof inviteUrl === 'string' && inviteUrl) {
    return inviteUrl;
  }

  const inviteToken = response?.data?.token || response?.data?.inviteToken;

  if (typeof inviteToken === 'string' && inviteToken) {
    return `${window.location.origin}${ROUTE_PATHS.LINE_REGISTER}?token=${encodeURIComponent(inviteToken)}`;
  }

  throw new Error('Invite link is invalid');
}

export default function EmployeeDetail(): JSX.Element {
  const { t } = useTranslation();
  const history = useHistory();
  const { id } = useParams<EmployeeDetailParam>();
  const [canEdit, setCanEdit] = useState(false);
  const [actionType, setActionType] = useState('');
  const [titleDialog, setTitleDialog] = useState('');
  const [msg, setMsg] = useState('');
  const [visibleConfirmationDialog, setVisibleConfirmationDialog] = useState(false);
  const [openCreateUserDialog, setOpenCreateUserDialog] = useState(false);
  const [isGeneratingLink, setIsGeneratingLink] = useState(false);
  const [isResettingLink, setIsResettingLink] = useState(false);

  const {
    data: employee,
    isFetching,
    refetch
  } = useQuery(['employee-detail', id], () => getEmployee(id), {
    refetchOnWindowFocus: false
  });
  const { data: teamOptions = [], isFetching: isTeamFetching } = useQuery(
    ['employee-team-options'],
    () => getSystemConfig('TEAM'),
    { refetchOnWindowFocus: false }
  );
  const { data: positionOptions = [], isFetching: isPositionFetching } = useQuery(
    ['employee-position-options'],
    () => getSystemConfig('POSITION'),
    { refetchOnWindowFocus: false }
  );

  const formik = useFormik<UpdateEmployeeRequest>({
    initialValues: {
      firstNameTh: employee?.firstNameTh ?? '',
      lastNameTh: employee?.lastNameTh ?? '',
      nickName: employee?.nickName ?? '',
      position: employee?.position?.code ?? '',
      phoneNumber: employee?.phoneNumber ?? '',
      status: employee?.status ?? '',
      additional: employee?.additional ?? '',
      team: employee?.team?.code ?? ''
    },
    enableReinitialize: true,
    validationSchema: Yup.object().shape({
      firstNameTh: Yup.string().required(t('employeeManagement.validation.firstNameTh')),
      lastNameTh: Yup.string().required(t('employeeManagement.validation.lastNameTh')),
      nickName: Yup.string().required(t('employeeManagement.validation.nickName')),
      position: Yup.string().required(t('employeeManagement.validation.position')),
      phoneNumber: Yup.string().required(t('employeeManagement.validation.phoneNumber')),
      team: Yup.string().required(t('employeeManagement.validation.team'))
    }),
    onSubmit: (values, actions) => {
      if (!employee?.employeeId) return;
      actions.setSubmitting(true);

      const updatePromise = updateEmployee(employee.employeeId, values);

      toast.promise(updatePromise, {
        loading: t('toast.loading'),
        success: () => {
          setCanEdit(false);
          refetch();
          return t('employeeManagement.message.updateSuccess');
        },
        error: t('employeeManagement.message.updateFailed')
      });

      updatePromise.finally(() => {
        actions.setSubmitting(false);
      });
    }
  });

  const title = useMemo(() => {
    if (!employee) {
      return t('employeeManagement.detailTitle');
    }

    return employee.nickName || getEmployeeName(employee) || employee.employeeId;
  }, [employee, t]);

  const handleGenerateRegisterLink = async () => {
    if (!employee?.userId) {
      return;
    }

    setIsGeneratingLink(true);

    try {
      const response = await inviteLineRegistration(employee.userId);
      copyText(resolveInviteLink(response));
      toast.success(t('employeeManagement.message.generateRegisterLinkSuccess'));
    } catch (error: any) {
      toast.error(`${t('toast.failed')} ${error?.response?.data?.message || error?.message || ''}`);
    } finally {
      setIsGeneratingLink(false);
    }
  };

  const handleResetLineBinding = async () => {
    if (!employee?.userId) {
      return;
    }

    setIsResettingLink(true);

    try {
      await resetLineBinding(employee.userId);
      toast.success(t('employeeManagement.message.resetLineBindingSuccess'));
    } catch (error: any) {
      toast.error(`${t('toast.failed')} ${error?.response?.data?.message || error?.message || ''}`);
    } finally {
      setIsResettingLink(false);
    }
  };

  const handleStartEdit = () => {
    formik.resetForm();
    setCanEdit(true);
  };

  const handleCancelEdit = () => {
    formik.resetForm();
    setCanEdit(false);
  };

  const isReadOnly = !canEdit;

  return (
    <Page>
      <LoadingDialog
        open={
          isFetching ||
          isGeneratingLink ||
          isResettingLink ||
          formik.isSubmitting ||
          isTeamFetching ||
          isPositionFetching
        }
      />
      <PageTitle title={title} />
      <Wrapper>
        <Stack direction={{ xs: 'column', sm: 'row' }} spacing={1} useFlexGap sx={{ justifyContent: { sm: 'flex-end' } }}>
          <Button
            variant="contained"
            className="btn-cool-grey"
            startIcon={<ArrowBackIos />}
            onClick={() => history.push(ROUTE_PATHS.EMPLOYEE_MANAGEMENT)}>
            {t('button.back')}
          </Button>
          <Can permission={PERMISSIONS.EMPLOYEE_EDIT}>
            {canEdit ? (
              <>
                <Button
                  variant="contained"
                  className="btn-amber-orange"
                  startIcon={<Cancel />}
                  onClick={handleCancelEdit}>
                  {t('button.cancel')}
                </Button>
                <Button
                  variant="contained"
                  className="btn-emerald-green"
                  startIcon={<Save />}
                  onClick={() => {
                    setActionType('update');
                    setTitleDialog(t('employeeManagement.action.update'));
                    setMsg(t('employeeManagement.message.confirmUpdate'));
                    setVisibleConfirmationDialog(true);
                  }}>
                  {t('button.update')}
                </Button>
              </>
            ) : (
              <Button
                variant="contained"
                className="btn-emerald-green"
                startIcon={<Edit />}
                onClick={handleStartEdit}>
                {t('button.edit')}
              </Button>
            )}
          </Can>
        </Stack>

        <Grid container spacing={1} alignItems="center" sx={{ mt: 1 }}>
          <Grid item xs={12}>
            <Typography variant="h6" component="h2">
              {t('employeeManagement.detailTitle')}
            </Typography>
          </Grid>
        </Grid>

        <Grid container spacing={1} sx={{ mt: 1 }}>
          <GridTextField item xs={12} sm={6}>
            <TextField
              fullWidth
              label={t('employeeManagement.column.employeeId')}
              value={employee?.employeeId || ''}
              InputProps={{ readOnly: true }}
              InputLabelProps={{ shrink: true }}
            />
          </GridTextField>
          <GridTextField item xs={12} sm={6}>
            <TextField
              fullWidth
              label={t('employeeManagement.column.status')}
              value={employee?.status || ''}
              InputProps={{
                readOnly: true,
                endAdornment: employee?.status ? (
                  <Chip
                    label={t(`userManagement.status.${employee.status}`)}
                    color={getStatusColor(employee.status)}
                    size="small"
                  />
                ) : undefined
              }}
              InputLabelProps={{ shrink: true }}
            />
          </GridTextField>

          <GridTextField item xs={12} sm={6}>
            <TextField
              fullWidth
              name="firstNameTh"
              label={t('employeeManagement.column.firstName')}
              value={formik.values.firstNameTh}
              onChange={formik.handleChange}
              onBlur={formik.handleBlur}
              error={Boolean(formik.touched.firstNameTh && formik.errors.firstNameTh)}
              helperText={formik.touched.firstNameTh && formik.errors.firstNameTh}
              InputProps={{ readOnly: isReadOnly }}
              InputLabelProps={{ shrink: true }}
            />
          </GridTextField>
          <GridTextField item xs={12} sm={6}>
            <TextField
              fullWidth
              name="lastNameTh"
              label={t('employeeManagement.column.lastName')}
              value={formik.values.lastNameTh}
              onChange={formik.handleChange}
              onBlur={formik.handleBlur}
              error={Boolean(formik.touched.lastNameTh && formik.errors.lastNameTh)}
              helperText={formik.touched.lastNameTh && formik.errors.lastNameTh}
              InputProps={{ readOnly: isReadOnly }}
              InputLabelProps={{ shrink: true }}
            />
          </GridTextField>

          <GridTextField item xs={12} sm={6}>
            <TextField
              fullWidth
              name="nickName"
              label={t('employeeManagement.column.nickName')}
              value={formik.values.nickName}
              onChange={formik.handleChange}
              onBlur={formik.handleBlur}
              error={Boolean(formik.touched.nickName && formik.errors.nickName)}
              helperText={formik.touched.nickName && formik.errors.nickName}
              InputProps={{ readOnly: isReadOnly }}
              InputLabelProps={{ shrink: true }}
            />
          </GridTextField>
          <GridTextField item xs={12} sm={6}>
            <TextField
              fullWidth
              name="phoneNumber"
              label={t('employeeManagement.column.phoneNumber')}
              value={formik.values.phoneNumber}
              onChange={formik.handleChange}
              onBlur={formik.handleBlur}
              error={Boolean(formik.touched.phoneNumber && formik.errors.phoneNumber)}
              helperText={formik.touched.phoneNumber && formik.errors.phoneNumber}
              InputProps={{ readOnly: isReadOnly }}
              InputLabelProps={{ shrink: true }}
            />
          </GridTextField>

          <GridTextField item xs={12} sm={6}>
            <TextField
              fullWidth
              name="position"
              select
              label={t('employeeManagement.column.position')}
              value={formik.values.position}
              onChange={formik.handleChange}
              onBlur={formik.handleBlur}
              error={Boolean(formik.touched.position && formik.errors.position)}
              helperText={formik.touched.position && formik.errors.position}
              disabled={isPositionFetching}
              SelectProps={{ readOnly: isReadOnly }}
              InputLabelProps={{ shrink: true }}>
              <MenuItem value="">{t('general.clearSelected')}</MenuItem>
              {positionOptions.map((option) => (
                <MenuItem key={option.code} value={option.code}>
                  {option.nameTh}
                </MenuItem>
              ))}
            </TextField>
          </GridTextField>
          <GridTextField item xs={12} sm={6}>
            <TextField
              fullWidth
              name="team"
              select
              label={t('employeeManagement.column.team')}
              value={formik.values.team}
              onChange={formik.handleChange}
              onBlur={formik.handleBlur}
              error={Boolean(formik.touched.team && formik.errors.team)}
              helperText={formik.touched.team && formik.errors.team}
              disabled={isTeamFetching}
              SelectProps={{ readOnly: isReadOnly }}
              InputLabelProps={{ shrink: true }}>
              <MenuItem value="">{t('general.clearSelected')}</MenuItem>
              {teamOptions.map((option) => (
                <MenuItem key={option.code} value={option.code}>
                  {option.nameTh}
                </MenuItem>
              ))}
            </TextField>
          </GridTextField>

          <GridTextField item xs={12}>
            <TextField
              fullWidth
              name="additional"
              label={t('employeeManagement.column.additional')}
              value={formik.values.additional}
              onChange={formik.handleChange}
              onBlur={formik.handleBlur}
              InputProps={{ readOnly: isReadOnly }}
              multiline
              minRows={3}
              InputLabelProps={{ shrink: true }}
            />
          </GridTextField>
        </Grid>

        <Grid container spacing={1} sx={{ mt: 3 }}>
          <GridTextField item xs={12}>
            <Grid container alignItems="center" justifyContent="space-between" spacing={2}>
              <Grid item xs={12} sm="auto">
                <Typography variant="h6" component="h3">
                  {t('employeeManagement.userDetailTitle')}
                </Typography>
              </Grid>
              <Can permission={PERMISSIONS.EMPLOYEE_EDIT}>
                <Grid item xs={12} sm="auto" sx={{ textAlign: { xs: 'left', sm: 'right' } }}>
                  <Grid container spacing={1} justifyContent={{ xs: 'flex-start', sm: 'flex-end' }}>
                    {employee?.userId && employee?.userDto?.status === 'PENDING_ACTIVATE' ? (
                      <Grid item>
                        <Button
                          variant="contained"
                          startIcon={<ContentCopy />}
                          onClick={() => {
                            void handleGenerateRegisterLink();
                          }}>
                          {t('employeeManagement.action.generateRegisterLink')}
                        </Button>
                      </Grid>
                    ) : null}
                    {employee?.userId && employee?.userDto?.status === 'ACTIVE' ? (
                      <Grid item>
                        <Button
                          variant="contained"
                          color="error"
                          startIcon={<LinkOff />}
                          onClick={() => {
                            void handleResetLineBinding();
                          }}>
                          {t('employeeManagement.action.revokeRegister')}
                        </Button>
                      </Grid>
                    ) : null}
                  </Grid>
                </Grid>
              </Can>
            </Grid>
          </GridTextField>
          {employee?.hasUser === false ? (
            <GridTextField item xs={12}>
              <Grid
                container
                spacing={2}
                justifyContent="center"
                sx={{
                  py: 4,
                  px: 3,
                  textAlign: 'center',
                  border: '1px dashed #cfd8dc',
                  borderRadius: 2,
                  color: '#607d8b',
                  backgroundColor: '#f8fbfc'
                }}>
                <Grid item xs={12}>
                  <Typography sx={{ fontWeight: 600 }}>
                    {t('employeeManagement.userNotCreated')}
                  </Typography>
                </Grid>
                <Can permission={PERMISSIONS.EMPLOYEE_EDIT}>
                  <Grid item xs={12}>
                    <Button
                      variant="contained"
                      className="btn-indigo-blue"
                      startIcon={<PersonAdd />}
                      onClick={() => setOpenCreateUserDialog(true)}>
                      {t('staffManagement.action.createUser')}
                    </Button>
                  </Grid>
                </Can>
              </Grid>
            </GridTextField>
          ) : (
            <>
              {employee?.userDto?.pictureUrl ? (
                <GridTextField item xs={12}>
                  <Grid container spacing={2} alignItems="center">
                    <Grid item>
                      <Avatar
                        src={employee.userDto.pictureUrl}
                        alt={
                          employee.userDto.displayName ||
                          employee.userDto.username ||
                          employee.employeeId
                        }
                        sx={{ width: 72, height: 72 }}
                      />
                    </Grid>
                  </Grid>
                </GridTextField>
              ) : null}

              <GridTextField item xs={12} sm={6}>
                <TextField
                  fullWidth
                  label={t('employeeManagement.column.userId')}
                  value={employee?.userId || employee?.userDto?.id || '-'}
                  InputProps={{ readOnly: true }}
                  InputLabelProps={{ shrink: true }}
                />
              </GridTextField>
              <GridTextField item xs={12} sm={6}>
                <TextField
                  fullWidth
                  label={t('employeeManagement.column.username')}
                  value={employee?.userDto?.username || '-'}
                  InputProps={{ readOnly: true }}
                  InputLabelProps={{ shrink: true }}
                />
              </GridTextField>

              <GridTextField item xs={12} sm={6}>
                <TextField
                  fullWidth
                  label={t('employeeManagement.column.displayName')}
                  value={employee?.userDto?.displayName || '-'}
                  InputProps={{ readOnly: true }}
                  InputLabelProps={{ shrink: true }}
                />
              </GridTextField>
              <GridTextField item xs={12} sm={6}>
                <TextField
                  fullWidth
                  label={t('employeeManagement.column.role')}
                  value={getUserRoleDisplay(employee?.userDto)}
                  InputProps={{ readOnly: true }}
                  InputLabelProps={{ shrink: true }}
                />
              </GridTextField>

              <GridTextField item xs={12} sm={6}>
                <TextField
                  fullWidth
                  label={t('employeeManagement.column.userStatus')}
                  value={employee?.userDto?.status || '-'}
                  InputProps={{
                    readOnly: true,
                    endAdornment: employee?.userDto?.status ? (
                      <Chip
                        label={t(`userManagement.status.${employee.userDto.status}`)}
                        color={getStatusColor(employee.userDto.status)}
                        size="small"
                      />
                    ) : undefined
                  }}
                  InputLabelProps={{ shrink: true }}
                />
              </GridTextField>
              <GridTextField item xs={12} sm={6}>
                <TextField
                  fullWidth
                  label={t('employeeManagement.column.lineUserId')}
                  value={employee?.userDto?.lineUserId || '-'}
                  InputProps={{ readOnly: true }}
                  InputLabelProps={{ shrink: true }}
                />
              </GridTextField>
            </>
          )}
        </Grid>
      </Wrapper>
      <AddNewAdminDialog
        open={openCreateUserDialog}
        staffId={employee?.employeeId}
        onClose={() => setOpenCreateUserDialog(false)}
      />
      <ConfirmDialog
        open={visibleConfirmationDialog}
        title={titleDialog}
        message={msg}
        confirmText={t('button.confirm')}
        cancelText={t('button.cancel')}
        onConfirm={() => {
          if (actionType === 'update') {
            formik.handleSubmit();
          }
          setVisibleConfirmationDialog(false);
        }}
        onCancel={() => setVisibleConfirmationDialog(false)}
        isShowCancelButton={true}
        isShowConfirmButton={true}
      />
    </Page>
  );
}

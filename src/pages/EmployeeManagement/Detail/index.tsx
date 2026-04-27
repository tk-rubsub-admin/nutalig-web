import { ArrowBackIos, ContentCopy, LinkOff, PersonAdd } from '@mui/icons-material';
import { Avatar, Button, Chip, Grid, TextField, Typography } from '@mui/material';
import AddNewAdminDialog from 'pages/AdminManagement/AddNewAdminDialog';
import PageTitle from 'components/PageTitle';
import LoadingDialog from 'components/LoadingDialog';
import { GridTextField, Wrapper } from 'components/Styled';
import { Page } from 'layout/LayoutRoute';
import { useMemo, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { useQuery } from 'react-query';
import { useHistory, useParams } from 'react-router-dom';
import { ROUTE_PATHS } from 'routes';
import { getEmployee } from 'services/Employee/employee-api';
import { EmployeeRecord } from 'services/Employee/employee-type';
import { inviteLineRegistration, resetLineBinding } from 'services/User/user-api';
import { copyText } from 'utils/copyContent';
import toast from 'react-hot-toast';

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
  const [openCreateUserDialog, setOpenCreateUserDialog] = useState(false);
  const [isGeneratingLink, setIsGeneratingLink] = useState(false);
  const [isResettingLink, setIsResettingLink] = useState(false);

  const { data: employee, isFetching } = useQuery(['employee-detail', id], () => getEmployee(id), {
    refetchOnWindowFocus: false
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

  return (
    <Page>
      <LoadingDialog open={isFetching || isGeneratingLink || isResettingLink} />
      <PageTitle title={title} />
      <Wrapper>
        <Grid container spacing={1} alignItems="center">
          <Grid item xs={12} sm={6}>
            <Typography variant="h6" component="h2">
              {t('employeeManagement.detailTitle')}
            </Typography>
          </Grid>
          <Grid item xs={12} sm={6} style={{ textAlign: 'right' }}>
            <Button
              variant="contained"
              startIcon={<ArrowBackIos />}
              onClick={() => history.push(ROUTE_PATHS.EMPLOYEE_MANAGEMENT)}>
              {t('button.back')}
            </Button>
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
              label={t('employeeManagement.column.name')}
              value={getEmployeeName(employee)}
              InputProps={{ readOnly: true }}
              InputLabelProps={{ shrink: true }}
            />
          </GridTextField>
          <GridTextField item xs={12} sm={6}>
            <TextField
              fullWidth
              label={t('employeeManagement.column.nickName')}
              value={employee?.nickName || '-'}
              InputProps={{ readOnly: true }}
              InputLabelProps={{ shrink: true }}
            />
          </GridTextField>

          <GridTextField item xs={12} sm={6}>
            <TextField
              fullWidth
              label={t('employeeManagement.column.position')}
              value={employee?.position?.nameTh || '-'}
              InputProps={{ readOnly: true }}
              InputLabelProps={{ shrink: true }}
            />
          </GridTextField>
          <GridTextField item xs={12} sm={6}>
            <TextField
              fullWidth
              label={t('employeeManagement.column.team')}
              value={employee?.team?.nameTh || '-'}
              InputProps={{ readOnly: true }}
              InputLabelProps={{ shrink: true }}
            />
          </GridTextField>

          <GridTextField item xs={12} sm={6}>
            <TextField
              fullWidth
              label={t('employeeManagement.column.phoneNumber')}
              value={employee?.phoneNumber || '-'}
              InputProps={{ readOnly: true }}
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
                <Grid item xs={12}>
                  <Button
                    variant="contained"
                    className="btn-indigo-blue"
                    startIcon={<PersonAdd />}
                    onClick={() => setOpenCreateUserDialog(true)}>
                    {t('staffManagement.action.createUser')}
                  </Button>
                </Grid>
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
                  value={
                    employee?.userDto?.role
                      ? `${employee.userDto.role.roleNameTh} (${employee.userDto.role.roleCode})`
                      : '-'
                  }
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
    </Page>
  );
}

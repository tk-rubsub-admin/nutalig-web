/* eslint-disable no-undef */
import {
  Autocomplete,
  Avatar,
  Box,
  Button,
  Grid,
  IconButton,
  InputAdornment,
  Menu,
  MenuItem,
  TextField,
  Typography,
  useMediaQuery,
  useTheme
} from '@mui/material';
import { makeStyles } from '@mui/styles';
import { useAuth } from 'auth/AuthContext';
import PageTitle from 'components/PageTitle';
import { Wrapper, GridTextField } from 'components/Styled';
import DatePicker from 'components/DatePicker';
import * as Yup from 'yup';
import { useFormik } from 'formik';
import dayjs from 'dayjs';
import { Page } from 'layout/LayoutRoute';
import { useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { useQuery } from 'react-query';
import { useHistory, useParams } from 'react-router-dom';
import { getAllCompany } from 'services/Company/company-api';
import { getSystemConfig } from 'services/Config/config-api';
import { GROUP_CODE, SystemConfig } from 'services/Config/config-type';
import {
  activeStaff,
  deleteStaff,
  getRoleList,
  getStaff,
  inactiveStaff,
  updateStaff
} from 'services/Staff/staff-api';
import { Staff, UpdateStaffRequest } from 'services/Staff/staff-type';
import { Company, Role } from 'services/User/user-type';
import {
  DEFAULT_DATE_FORMAT,
  DEFAULT_DATE_FORMAT_BFF,
  DEFAULT_DATE_FORMAT_MONTH_TEXT,
  DEFAULT_DATETIME_FORMAT_MONTH_TEXT,
  formatDateStringWithPattern
} from 'utils';
import ConfirmDialog from 'components/ConfirmDialog';
import {
  ArrowBackIos,
  Cancel,
  ContentCopy,
  DeleteForever,
  Person,
  PersonAdd,
  PersonOff,
  Save,
  Send
} from '@mui/icons-material';
import MenuIcon from '@mui/icons-material/Menu';
import { ROUTE_PATHS } from 'routes';
import toast from 'react-hot-toast';
import LoadingDialog from 'components/LoadingDialog';
import AddNewAdminDialog from 'pages/AdminManagement/AddNewAdminDialog';
import AuditInfo from 'components/AuditInfo';
// import { QRCode } from 'qrcode.react';
import QRCode from 'react-qr-code';
import { sendTestNoti } from 'services/Line/line-api';
import { copyText } from 'utils/copyContent';

export interface StaffParam {
  id: string;
}

export default function StaffDetail(): JSX.Element {
  const useStyles = makeStyles({
    noResultMessage: {
      textAlign: 'center',
      fontSize: '1.2em',
      fontWeight: 'bold',
      padding: '48px 0'
    },
    tableHeader: {
      border: '2px solid #e0e0e0',
      fontWeight: 'bold',
      paddingLeft: '10px',
      textAlign: 'center'
    },
    datePickerFromTo: {
      '&& .MuiOutlinedInput-input': {
        padding: '16.5px 14px',
        fontSize: '14px'
      },
      '&& .MuiFormLabel-root': {
        fontSize: '13px'
      }
    }
  });
  const classes = useStyles();
  const theme = useTheme();
  const isDownSm = useMediaQuery(theme.breakpoints.down('sm'));
  const history = useHistory();
  const { getRole } = useAuth();
  const params = useParams<StaffParam>();
  const [canEdit, setCanEdit] = useState<boolean>(false);
  const [actionType, setActionType] = useState<string>('');
  const [title, setTitle] = useState<string>('');
  const [msg, setMsg] = useState<string>('');
  const [visibleConfirmationDialog, setVisibleConfirmationDialog] = useState(false);
  const [openCreateUserDialog, setOpenCreateUserDialog] = useState(false);
  const [staff, setStaff] = useState<Staff>();
  const { t } = useTranslation();
  const [anchorEl, setAnchorEl] = useState<null | HTMLElement>(null);
  const openMenu = Boolean(anchorEl);

  const handleOpenMenu = (event: React.MouseEvent<HTMLButtonElement>) => {
    setAnchorEl(event.currentTarget);
  };

  const handleCloseMenu = () => {
    setAnchorEl(null);
  };
  const {
    data: staffData,
    refetch: staffRefetch,
    isFetching: isStaffFetching
  } = useQuery('staff', () => getStaff(params.id), {
    refetchOnWindowFocus: false
  });
  const { data: staffRoleList, isFetching: isStaffRoleFetching } = useQuery(
    'staff-role-list',
    () => getRoleList(),
    { refetchOnWindowFocus: false }
  );
  const { data: nationalityList, isFetching: isNationalityFetching } = useQuery(
    'nationality',
    () => getSystemConfig(GROUP_CODE.NATIONALITY),
    { refetchOnWindowFocus: false }
  );
  const { data: departmentList, isFetching: isDepartmentFetching } = useQuery(
    'department',
    () => getSystemConfig(GROUP_CODE.STAFF_DEPARTMENT),
    { refetchOnWindowFocus: false }
  );
  const { data: staffTypeList, isFetching: isStaffTypeFetching } = useQuery(
    'staff-type',
    () => getSystemConfig(GROUP_CODE.STAFF_TYPE),
    { refetchOnWindowFocus: false }
  );
  const { data: staffType2List, isFetching: isStaffType2Fetching } = useQuery(
    'staff-type-2',
    () => getSystemConfig(GROUP_CODE.STAFF_TYPE_2),
    { refetchOnWindowFocus: false }
  );
  const { data: workspaceList, isFetching: isWorkspaceFetching } = useQuery(
    'workspace',
    () => getSystemConfig(GROUP_CODE.WORKSPACE),
    { refetchOnWindowFocus: false }
  );
  const { data: companyList, isFetching: isCompanyFetching } = useQuery(
    'company-list',
    () => getAllCompany(),
    { refetchOnWindowFocus: false }
  );

  const onAutoCompleteChange = (field: string, value: SystemConfig, reason: string) => {
    if (reason === 'clear') {
      formik.setFieldValue(field, '');
    } else {
      formik.setFieldValue(field, value);
    }
  };

  const handleDeleteStaff = () => {
    toast.promise(deleteStaff(staff?.id), {
      loading: t('toast.loading'),
      success: () => {
        history.push(ROUTE_PATHS.STAFF_MANAGEMENT);
        return t('staffManagement.deleteStaffSuccess');
      },
      error: (err) => {
        return t('staffManagement.deleteStaffFailed') + err;
      }
    });
  };

  const handleInactiveStaff = () => {
    toast.promise(inactiveStaff(staff?.id), {
      loading: t('toast.loading'),
      success: () => {
        staffRefetch();
        return t('staffManagement.inactiveStaffSuccess');
      },
      error: (err) => {
        return t('staffManagement.inactiveStaffFailed') + err;
      }
    });
  };

  const handleActiveStaff = () => {
    toast.promise(activeStaff(staff?.id), {
      loading: t('toast.loading'),
      success: () => {
        staffRefetch();
        return t('staffManagement.activeStaffSuccess');
      },
      error: (err) => {
        return t('staffManagement.activeStaffFailed') + err;
      }
    });
  };

  const handleSendTestNoti = () => {
    toast.promise(sendTestNoti(staff?.userId), {
      loading: t('toast.loading'),
      success: () => {
        return t('toast.success');
      },
      error: (err) => {
        return t('toast.failed') + err;
      }
    });
  };

  const formik = useFormik({
    initialValues: {
      picture: '',
      employeeId: staff?.employeeId || '',
      firstName: staff?.firstName || '',
      lastName: staff?.lastName || '',
      nickname: staff?.nickname || '',
      telNo: staff?.telNo || '',
      lineId: staff?.lineId || '',
      department: staff?.department || '',
      nationality: staff?.nationality || '',
      roleCode: staff?.role || '',
      duty: staff?.duty || '',
      workingStartDate: staff?.workingStartDate || '',
      workspace: staff?.workSpace || '',
      staffType: staff?.staffType || '',
      type: staff?.type || '',
      company: staff?.company || null,
      startWorkingTime: staff?.startWorkingTime || '',
      endWorkingTime: staff?.endWorkingTime || ''
    },
    enableReinitialize: true,
    validationSchema: Yup.object().shape({
      firstName: Yup.string().max(255).required(t('staffManagement.validateMessage.firstName')),
      lastName: Yup.string().max(255).required(t('staffManagement.validateMessage.lastName')),
      nickname: Yup.string().max(255).required(t('staffManagement.validateMessage.nickname')),
      nationality: Yup.object().required(t('staffManagement.validateMessage.nationality')),
      roleCode: Yup.object().required(t('staffManagement.validateMessage.roleCode')),
      company: Yup.object().required(t('staffManagement.validateMessage.company')),
      workspace: Yup.object().required(t('staffManagement.validateMessage.workspace'))
    }),
    onSubmit: (values, actions) => {
      actions.setSubmitting(true);
      const updateStaffRequest: UpdateStaffRequest = {
        picture: '',
        firstName: values.firstName,
        lastName: values.lastName,
        nickname: values.nickname,
        telNo: values.telNo,
        roleCode: values.roleCode.roleCode,
        duty: values.duty,
        workSpace: values.workspace.code,
        staffType: values.staffType,
        companyId: values.company.id,
        startWorkingTime: values.startWorkingTime,
        endWorkingTime: values.endWorkingTime,
        workingStartDate: values.workingStartDate,
        lineId: values.lineId,
        type: values.type.code,
        status: 'ACTIVE',
        nationality: values.nationality.code,
        department: values.department
      };
      toast.promise(updateStaff(updateStaffRequest, staff?.id), {
        loading: t('toast.loading'),
        success: () => {
          staffRefetch();
          return t('staffManagement.updateStaffSuccess');
        },
        error: (err) => {
          return t('staffManagement.updateStaffFailed') + err;
        }
      });
    }
  });

  useEffect(() => {
    setCanEdit(getRole() === 'SUPER_ADMIN' || getRole().startsWith('ADMIN'));
    if (staffData !== undefined) {
      setStaff(staffData);
    }
  }, [staffData]);

  return (
    <Page>
      <PageTitle title={staff?.displayName} />
      <Wrapper>
        <Grid
          container
          spacing={1}
          sx={{
            mt: 1,
            justifyContent: { xs: 'flex-start', sm: 'flex-end' }
          }}>
          <Grid item xs={6} sm="auto">
            <Button
              fullWidth
              variant="contained"
              className="btn-cool-grey"
              onClick={() => {
                setActionType('back');
                setTitle(t('message.backTitle'));
                setMsg(t('message.backMsg'));
                setVisibleConfirmationDialog(true);
              }}
              startIcon={<ArrowBackIos />}>
              {t('button.back')}
            </Button>
          </Grid>
          {staff?.isLineConnect ? (
            <Grid item xs={6} sm="auto">
              <Button
                fullWidth
                variant="contained"
                className="btn-green-teal"
                onClick={handleSendTestNoti}
                startIcon={<Send />}>
                ทดสอบส่งแจ้งเตือน
              </Button>
            </Grid>
          ) : (
            <></>
          )}
          <Grid item xs={6} sm="auto">
            <Button
              fullWidth={isDownSm}
              variant="contained"
              className="btn-slate-grey"
              startIcon={<MenuIcon />}
              onClick={handleOpenMenu}>
              {t('button.menu')}
            </Button>
          </Grid>

          <Grid item xs={6} sm="auto">
            <Button
              fullWidth
              variant="contained"
              className="btn-emerald-green"
              disabled={!canEdit}
              onClick={() => {
                setActionType('update');
                setTitle(t('staffManagement.updateStaff'));
                setMsg(t('staffManagement.confirmMsgUpdateStaff'));
                setVisibleConfirmationDialog(true);
              }}
              startIcon={<Save />}>
              {t('button.update')}
            </Button>
          </Grid>

          <Grid item xs={6} sm="auto">
            <Button
              fullWidth
              variant="contained"
              className="btn-amber-orange"
              disabled={!canEdit}
              onClick={() => {
                setActionType('clear');
                setTitle(t('message.clearDataTitle'));
                setMsg(t('message.clearDataMsg'));
                setVisibleConfirmationDialog(true);
              }}
              startIcon={<Cancel />}>
              {t('button.clear')}
            </Button>
          </Grid>
        </Grid>
        <Menu
          anchorEl={anchorEl}
          open={openMenu}
          onClose={handleCloseMenu}
          anchorOrigin={{ vertical: 'bottom', horizontal: 'left' }}
          transformOrigin={{ vertical: 'top', horizontal: 'left' }}>
          <MenuItem
            disabled={staff?.isUser}
            onClick={() => {
              setActionType('create_user');
              setTitle(t('staffManagement.newUser'));
              setMsg(t('staffManagement.confirmMsgNewUser'));
              setVisibleConfirmationDialog(true);
              handleCloseMenu();
            }}>
            <PersonAdd fontSize="small" style={{ marginRight: 8 }} />
            {t('staffManagement.action.createUser')}
          </MenuItem>
          {staff?.status === 'ACTIVE' ? (
            <MenuItem
              disabled={!canEdit}
              onClick={() => {
                setActionType('inactive');
                setTitle(t('staffManagement.inactiveStaff'));
                setMsg(t('staffManagement.confirmMsgInactiveStaff'));
                setVisibleConfirmationDialog(true);
                handleCloseMenu();
              }}>
              <PersonOff fontSize="small" style={{ marginRight: 8 }} />
              {t('staffManagement.action.inactive')}
            </MenuItem>
          ) : (
            <MenuItem
              disabled={!canEdit}
              onClick={() => {
                setActionType('active');
                setTitle(t('staffManagement.activeStaff'));
                setMsg(t('staffManagement.confirmMsgActiveStaff'));
                setVisibleConfirmationDialog(true);
                handleCloseMenu();
              }}>
              <Person fontSize="small" style={{ marginRight: 8 }} />
              {t('staffManagement.action.active')}
            </MenuItem>
          )}
          {/* Delete */}
          <MenuItem
            disabled={!canEdit}
            onClick={() => {
              setActionType('delete');
              setTitle(t('staffManagement.deleteStaff'));
              setMsg(t('staffManagement.confirmMsgDeleteStaff'));
              setVisibleConfirmationDialog(true);
              handleCloseMenu();
            }}
            sx={{ color: 'error.main' }}>
            <DeleteForever fontSize="small" style={{ marginRight: 8 }} />
            {t('staffManagement.action.delete')}
          </MenuItem>
        </Menu>
      </Wrapper>
      <Wrapper>
        <Grid container spacing={1}>
          <GridTextField item xs={12} sm={12}>
            <Typography variant="h3">{t('staffManagement.detail')}</Typography>
          </GridTextField>
          <GridTextField item xs={12} sm={6}>
            <Box display="flex" flexDirection="column" alignItems="flex-start">
              <Typography variant="subtitle1" gutterBottom align="left">
                {t('general.profileImage')}
              </Typography>
              <Box display="flex" justifyContent="center" width="100%">
                <Avatar
                  id={`user-profile-picture`}
                  variant="rounded"
                  src={staff?.picture}
                  sx={{
                    width: 120,
                    height: 120
                  }}
                />
              </Box>
            </Box>
          </GridTextField>
          <GridTextField item xs={12} sm={6}>
            {isStaffFetching ||
              (staff?.userId !== null && (
                <Box display="flex" flexDirection="column" alignItems="flex-start">
                  <Typography variant="subtitle1" gutterBottom align="left">
                    เชื่อมต่อ LINE
                  </Typography>
                  <Box display="flex" justifyContent="center" width="100%">
                    <QRCode
                      value={`https://liff.line.me/2008988361-sH0cqOKp?userId=` + staff?.userId}
                      size={128}
                    />
                    <TextField
                      label="Link"
                      fullWidth
                      variant="outlined"
                      value={`https://liff.line.me/2008988361-sH0cqOKp?userId=` + staff?.userId}
                      InputProps={{
                        readOnly: true,
                        endAdornment: (
                          <InputAdornment position="end">
                            <IconButton
                              size="small"
                              onClick={() => {
                                copyText(
                                  `https://liff.line.me/2008988361-sH0cqOKp?userId=` + staff?.userId
                                );
                              }}>
                              <ContentCopy />
                            </IconButton>
                          </InputAdornment>
                        )
                      }}
                      sx={{ marginLeft: '12px' }}
                    />
                  </Box>
                </Box>
              ))}
          </GridTextField>
          <GridTextField item xs={6} sm={6}>
            <TextField
              type="text"
              label={t('general.id')}
              fullWidth
              disabled
              variant="outlined"
              value={staff?.id}
              InputLabelProps={{ shrink: true }}
            />
          </GridTextField>
          <GridTextField item xs={6} sm={6}>
            <TextField
              type="text"
              label={t('staffManagement.column.employeeId')}
              fullWidth
              disabled
              variant="outlined"
              value={staff?.employeeId}
              InputLabelProps={{ shrink: true }}
            />
          </GridTextField>
          <GridTextField item xs={12} sm={6}>
            <TextField
              type="text"
              label={t('staffManagement.column.displayName')}
              fullWidth
              disabled
              variant="outlined"
              value={staff?.displayName}
              InputLabelProps={{ shrink: true }}
            />
          </GridTextField>
          <GridTextField item xs={12} sm={6}>
            <TextField
              type="text"
              label={t('staffManagement.column.name')}
              fullWidth
              disabled={!canEdit}
              variant="outlined"
              value={formik.values.firstName}
              error={Boolean(formik.touched.firstName && formik.errors.firstName)}
              helperText={formik.touched.firstName && formik.errors.firstName}
              onChange={({ target }) => {
                formik.setFieldValue('firstName', target.value);
              }}
              InputLabelProps={{ shrink: true }}
            />
          </GridTextField>
          <GridTextField item xs={12} sm={6}>
            <TextField
              type="text"
              label={t('staffManagement.column.lastname')}
              fullWidth
              disabled={!canEdit}
              variant="outlined"
              value={formik.values.lastName}
              error={Boolean(formik.touched.lastName && formik.errors.lastName)}
              helperText={formik.touched.lastName && formik.errors.lastName}
              onChange={({ target }) => {
                formik.setFieldValue('lastName', target.value);
              }}
              InputLabelProps={{ shrink: true }}
            />
          </GridTextField>
          <GridTextField item xs={12} sm={6}>
            <TextField
              type="text"
              label={t('staffManagement.column.nickname')}
              fullWidth
              disabled={!canEdit}
              variant="outlined"
              value={formik.values.nickname}
              error={Boolean(formik.touched.nickname && formik.errors.nickname)}
              helperText={formik.touched.nickname && formik.errors.nickname}
              onChange={({ target }) => {
                formik.setFieldValue('nickname', target.value);
              }}
              InputLabelProps={{ shrink: true }}
            />
          </GridTextField>
          <GridTextField item xs={12} sm={6}>
            <TextField
              type="text"
              label={t('staffManagement.column.telNo')}
              fullWidth
              disabled={!canEdit}
              variant="outlined"
              value={formik.values.telNo}
              onChange={({ target }) => {
                formik.setFieldValue('telNo', target.value);
              }}
              InputLabelProps={{ shrink: true }}
            />
          </GridTextField>
          <GridTextField item xs={12} sm={6}>
            <TextField
              type="text"
              label={t('staffManagement.column.lineId')}
              fullWidth
              disabled={!canEdit}
              variant="outlined"
              value={formik.values.lineId}
              onChange={({ target }) => {
                formik.setFieldValue('lineId', target.value);
              }}
              InputLabelProps={{ shrink: true }}
            />
          </GridTextField>
          <GridTextField item xs={12} sm={6}>
            <Autocomplete
              disabled={isNationalityFetching}
              disablePortal
              options={nationalityList?.map((option: SystemConfig) => option) || []}
              getOptionLabel={(option: SystemConfig) => option.nameTh}
              sx={{ width: '100%' }}
              value={formik.values.nationality || null}
              onChange={(_event, value, reason) => {
                onAutoCompleteChange('nationality', value, reason);
              }}
              renderInput={(params) => (
                <TextField
                  {...params}
                  label={t('staffManagement.column.nationality')}
                  InputLabelProps={{ shrink: true }}
                  error={Boolean(formik.touched.nationality && formik.errors.nationality)}
                  helperText={formik.touched.nationality && formik.errors.nationality}
                />
              )}
            />
          </GridTextField>
          <GridTextField item xs={12} sm={6}>
            <Autocomplete
              disabled={isDepartmentFetching}
              disablePortal
              options={departmentList?.map((option: SystemConfig) => option) || []}
              getOptionLabel={(option: SystemConfig) => option.nameTh}
              sx={{ width: '100%' }}
              value={departmentList?.filter((d) => d.code === formik.values.department)[0] || null}
              onChange={(_event, value, reason) => {
                onAutoCompleteChange('department', value, reason);
              }}
              renderInput={(params) => (
                <TextField
                  {...params}
                  label={t('staffManagement.column.department')}
                  InputLabelProps={{ shrink: true }}
                  inputProps={{
                    ...params.inputProps,
                    readOnly: true // 🔑 Prevents keyboard
                  }}
                />
              )}
            />
          </GridTextField>
          <GridTextField item xs={12} sm={6}>
            <Autocomplete
              disabled={isStaffRoleFetching}
              disablePortal
              options={staffRoleList?.map((option: Role) => option) || []}
              getOptionLabel={(option: Role) => option.roleNameTh}
              sx={{ width: '100%' }}
              value={formik.values.roleCode || null}
              onChange={(_event, value, reason) => {
                onAutoCompleteChange('roleCode', value, reason);
              }}
              renderInput={(params) => (
                <TextField
                  {...params}
                  label={t('staffManagement.column.role')}
                  InputLabelProps={{ shrink: true }}
                  error={Boolean(formik.touched.roleCode && formik.errors.roleCode)}
                  helperText={formik.touched.roleCode && formik.errors.roleCode}
                />
              )}
            />
          </GridTextField>
          <GridTextField item xs={12} sm={6}>
            <TextField
              type="text"
              label={t('staffManagement.column.duty')}
              fullWidth
              onChange={({ target }) => {
                formik.setFieldValue('duty', target.value);
              }}
              variant="outlined"
              value={formik.values.duty}
              InputLabelProps={{ shrink: true }}
            />
          </GridTextField>
          <GridTextField item xs={12} sm={6}>
            <Autocomplete
              disabled={isCompanyFetching}
              disablePortal
              options={companyList?.map((option: Company) => option) || []}
              getOptionLabel={(option: Company) => option.nameTh}
              sx={{ width: '100%' }}
              value={formik.values.company || null}
              onChange={(_event, value, reason) => {
                onAutoCompleteChange('company', value, reason);
              }}
              renderInput={(params) => (
                <TextField
                  {...params}
                  label={t('staffManagement.column.company')}
                  InputLabelProps={{ shrink: true }}
                  error={Boolean(formik.touched.company && formik.errors.company)}
                  helperText={formik.touched.company && formik.errors.company}
                />
              )}
            />
          </GridTextField>
          <GridTextField item xs={12} sm={6}>
            <Autocomplete
              disabled={isWorkspaceFetching}
              disablePortal
              options={workspaceList?.map((option) => option) || []}
              getOptionLabel={(option: SystemConfig) => option.nameTh}
              sx={{ width: '100%' }}
              value={formik.values.workspace || null}
              onChange={(_event, value, reason) => {
                onAutoCompleteChange('workspace', value, reason);
              }}
              renderInput={(params) => (
                <TextField
                  {...params}
                  label={t('staffManagement.column.workingspace')}
                  InputLabelProps={{ shrink: true }}
                  error={Boolean(formik.touched.workspace && formik.errors.workspace)}
                  helperText={formik.touched.workspace && formik.errors.workspace}
                />
              )}
            />
          </GridTextField>
          <GridTextField item xs={12} sm={6}>
            <Autocomplete
              disabled={isStaffType2Fetching}
              disablePortal
              options={staffType2List?.map((option) => option) || []}
              getOptionLabel={(option: SystemConfig) => option.nameTh}
              sx={{ width: '100%' }}
              value={staffType2List?.filter((st) => st.code === formik.values.staffType)[0] || null}
              onChange={(_event, value, reason) => {
                onAutoCompleteChange('staffType', value, reason);
              }}
              renderInput={(params) => (
                <TextField
                  {...params}
                  label={t('staffManagement.column.type2')}
                  InputLabelProps={{ shrink: true }}
                  inputProps={{
                    ...params.inputProps,
                    readOnly: true // 🔑 Prevents keyboard
                  }}
                />
              )}
            />
          </GridTextField>
          <GridTextField item xs={12} sm={6}>
            <Autocomplete
              disabled={isStaffTypeFetching}
              disablePortal
              options={staffTypeList?.map((option) => option) || []}
              getOptionLabel={(option: SystemConfig) => option.nameTh}
              sx={{ width: '100%' }}
              value={formik.values.type || null}
              onChange={(_event, value, reason) => {
                onAutoCompleteChange('type', value, reason);
              }}
              renderInput={(params) => (
                <TextField
                  {...params}
                  label={t('staffManagement.column.type')}
                  InputLabelProps={{ shrink: true }}
                  inputProps={{
                    ...params.inputProps,
                    readOnly: true // 🔑 Prevents keyboard
                  }}
                />
              )}
            />
          </GridTextField>
          <GridTextField item xs={12} sm={4} style={{ paddingTop: '30px' }}>
            {staff?.workingStartDate === null ? (
              <DatePicker
                className={classes.datePickerFromTo}
                fullWidth
                inputVariant="outlined"
                InputLabelProps={{ shrink: true }}
                label={t('staffManagement.column.startWorkingDate')}
                name="selectedFromDate"
                format={DEFAULT_DATE_FORMAT}
                value={formik.values.workingStartDate || null}
                onChange={(date) => {
                  if (date !== null) {
                    formik.setFieldValue(
                      'workingStartDate',
                      dayjs(date.toDate()).startOf('day').format(DEFAULT_DATE_FORMAT_BFF)
                    );
                  } else {
                    formik.setFieldValue('workingStartDate', '');
                  }
                }}
              />
            ) : (
              <TextField
                type="text"
                label={t('staffManagement.column.startWorkingDate')}
                fullWidth
                variant="outlined"
                value={
                  formatDateStringWithPattern(
                    formik.values.workingStartDate,
                    DEFAULT_DATE_FORMAT_MONTH_TEXT
                  ) || ''
                }
                InputLabelProps={{ shrink: true }}
              />
            )}
          </GridTextField>
          <GridTextField item xs={6} sm={4}>
            <TextField
              type="time"
              label={t('staffManagement.column.startWorkingHour')}
              fullWidth
              variant="outlined"
              value={formik.values.startWorkingTime}
              onChange={(e) => formik.setFieldValue('startWorkingTime', e.target.value)}
              inputProps={{ step: 300 }} // 5 นาที
            />
          </GridTextField>
          <GridTextField item xs={6} sm={4}>
            <TextField
              type="time"
              label={t('staffManagement.column.endWorkingHour')}
              fullWidth
              variant="outlined"
              value={formik.values.endWorkingTime}
              onChange={(e) => formik.setFieldValue('endWorkingTime', e.target.value)}
              inputProps={{ step: 300 }} // 5 นาที
            />
          </GridTextField>
          <GridTextField item xs={12} sm={12}>
            <AuditInfo
              createdBy={staff?.createdBy}
              createdDate={staff?.createdDate}
              updatedBy={staff?.updatedBy}
              updatedDate={staff?.updatedDate}
              createdLabel={t('general.createdBy')}
              updatedLabel={t('general.updatedBy')}
              formatDate={(d) => formatDateStringWithPattern(d, DEFAULT_DATETIME_FORMAT_MONTH_TEXT)}
            />
          </GridTextField>
        </Grid>
      </Wrapper>
      <Wrapper>
        <Grid
          container
          spacing={1}
          sx={{
            mt: 1,
            justifyContent: { xs: 'flex-start', sm: 'flex-end' }
          }}>
          <Grid item xs={6} sm="auto">
            <Button
              fullWidth
              variant="contained"
              className="btn-cool-grey"
              onClick={() => {
                setActionType('back');
                setTitle(t('message.backTitle'));
                setMsg(t('message.backMsg'));
                setVisibleConfirmationDialog(true);
              }}
              startIcon={<ArrowBackIos />}>
              {t('button.back')}
            </Button>
          </Grid>
          {staff?.isLineConnect ? (
            <Grid item xs={6} sm="auto">
              <Button
                fullWidth
                variant="contained"
                className="btn-green-teal"
                onClick={handleSendTestNoti}
                startIcon={<Send />}>
                ทดสอบส่งแจ้งเตือน
              </Button>
            </Grid>
          ) : (
            <></>
          )}
          <Grid item xs={6} sm="auto">
            <Button
              fullWidth
              variant="contained"
              className="btn-slate-grey"
              startIcon={<MenuIcon />}
              onClick={handleOpenMenu}>
              {t('button.menu')}
            </Button>
          </Grid>

          <Grid item xs={6} sm="auto">
            <Button
              fullWidth
              variant="contained"
              className="btn-emerald-green"
              disabled={!canEdit}
              onClick={() => {
                setActionType('update');
                setTitle(t('staffManagement.updateStaff'));
                setMsg(t('staffManagement.confirmMsgUpdateStaff'));
                setVisibleConfirmationDialog(true);
              }}
              startIcon={<Save />}>
              {t('button.update')}
            </Button>
          </Grid>
          <Grid item xs={6} sm="auto">
            <Button
              fullWidth
              variant="contained"
              className="btn-amber-orange"
              disabled={!canEdit}
              onClick={() => {
                setActionType('clear');
                setTitle(t('message.clearDataTitle'));
                setMsg(t('message.clearDataMsg'));
                setVisibleConfirmationDialog(true);
              }}
              startIcon={<Cancel />}>
              {t('button.clear')}
            </Button>
          </Grid>
        </Grid>
      </Wrapper>
      <ConfirmDialog
        open={visibleConfirmationDialog}
        title={title}
        message={msg}
        confirmText={t('button.confirm')}
        cancelText={t('button.cancel')}
        onConfirm={() => {
          if (actionType === 'update') {
            formik.handleSubmit();
          } else if (actionType === 'create_user') {
            setOpenCreateUserDialog(true);
          } else if (actionType === 'clear') {
            formik.resetForm();
          } else if (actionType === 'back') {
            history.push(ROUTE_PATHS.STAFF_MANAGEMENT);
          } else if (actionType === 'delete') {
            handleDeleteStaff();
          } else if (actionType === 'active') {
            handleActiveStaff();
          } else if (actionType === 'inactive') {
            handleInactiveStaff();
          }
          setVisibleConfirmationDialog(false);
        }}
        onCancel={() => setVisibleConfirmationDialog(false)}
        isShowCancelButton={true}
        isShowConfirmButton={true}
      />
      <LoadingDialog open={isStaffFetching} />
      <AddNewAdminDialog
        open={openCreateUserDialog}
        staffId={staff?.id}
        company={staff?.company}
        onClose={() => {
          history.push(ROUTE_PATHS.STAFF_MANAGEMENT);
          setVisibleConfirmationDialog(false);
          setOpenCreateUserDialog(false);
        }}
      />
    </Page>
  );
}

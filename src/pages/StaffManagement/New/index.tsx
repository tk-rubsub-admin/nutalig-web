import { Save, Cancel, ArrowBackIos } from '@mui/icons-material';
import {
  Grid,
  Typography,
  Button,
  TextField,
  Autocomplete,
  useTheme,
  useMediaQuery,
  Stack
} from '@mui/material';
import { makeStyles } from '@mui/styles';
import dayjs from 'dayjs';
import PageTitle from 'components/PageTitle';
import { Wrapper, GridTextField } from 'components/Styled';
import FileUploader from 'components/FileUploader';
import DatePicker from 'components/DatePicker';
import { useFormik } from 'formik';
import * as Yup from 'yup';
import { Page } from 'layout/LayoutRoute';
import { useTranslation } from 'react-i18next';
import { useHistory } from 'react-router-dom';
import ImageFileUploaderWrapper from 'components/ImageFileUploaderWrapper';
import { useState } from 'react';
import { GROUP_CODE, SystemConfig } from 'services/Config/config-type';
import { useQuery } from 'react-query';
import { getAllCompany } from 'services/Company/company-api';
import { getSystemConfig } from 'services/Config/config-api';
import { createStaff, getRoleList } from 'services/Staff/staff-api';
import { Company } from 'services/Company/company-type';
import { DEFAULT_DATE_FORMAT, DEFAULT_DATE_FORMAT_BFF, resizeFile } from 'utils';
import { Role } from 'services/User/user-type';
import toast from 'react-hot-toast';
import { CreateStaffResponse } from 'services/Staff/staff-type';
import ConfirmDialog from 'components/ConfirmDialog';
import { ROUTE_PATHS } from 'routes';
import AddNewAdminDialog from 'pages/AdminManagement/AddNewAdminDialog';

export default function NewStaff(): JSX.Element {
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
        padding: '16.5px 14px'
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
  const { t } = useTranslation();
  const [actionType, setActionType] = useState<string>('');
  const [title, setTitle] = useState<string>('');
  const [msg, setMsg] = useState<string>('');
  const [newStaffId, setNewStaffId] = useState<string>('');
  const [visibleConfirmationDialog, setVisibleConfirmationDialog] = useState(false);
  const [openCreateUserDialog, setOpenCreateUserDialog] = useState(false);
  const [logoImageFiles, setLogoImageFiles] = useState<File[]>([]);
  const logoImageFileUrls = logoImageFiles.map((file) => URL.createObjectURL(file));

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

  const formik = useFormik({
    initialValues: {
      picture: '',
      employeeId: '',
      firstName: '',
      lastName: '',
      nickname: '',
      telNo: '',
      nationality: '',
      roleCode: '',
      duty: '',
      workingStartDate: '',
      workspace: '',
      staffType: '',
      type: '',
      company: null,
      startWorkingTime: null,
      endWorkingTime: null,
      lineId: '',
      department: ''
    },
    enableReinitialize: true,
    validationSchema: Yup.object().shape({
      employeeId: Yup.string().required(t('staffManagement.validateMessage.employeeId')),
      firstName: Yup.string().max(255).required(t('staffManagement.validateMessage.firstName')),
      lastName: Yup.string().max(255).required(t('staffManagement.validateMessage.lastName')),
      nickname: Yup.string().max(255).required(t('staffManagement.validateMessage.nickname')),
      nationality: Yup.object().nullable().required(t('staffManagement.validateMessage.nationality')),
      roleCode: Yup.object().nullable().required(t('staffManagement.validateMessage.roleCode')),
      company: Yup.object().nullable().required(t('staffManagement.validateMessage.company')),
      workspace: Yup.object().nullable().required(t('staffManagement.validateMessage.workspace'))
    }),
    onSubmit: async (values, actions) => {
      actions.setSubmitting(true);
      const formData = new FormData();
      if (logoImageFiles[0] !== undefined) {
        const newFile = await resizeFile(logoImageFiles[0]);
        formData.append('picture', newFile);
      }
      formData.append('employeeId', values.employeeId);
      formData.append('firstName', values.firstName);
      formData.append('lastName', values.lastName);
      formData.append('nickname', values.nickname);
      formData.append('telNo', values.telNo);
      formData.append('nationality', values.nationality.code);
      formData.append('roleCode', values.roleCode.roleCode);
      formData.append('duty', values.duty);
      formData.append('workingStartDate', values.workingStartDate);
      formData.append('workSpace', values.workspace.code);
      formData.append('type', values.type.code);
      formData.append('staffType', values.staffType.code);
      formData.append('companyId', values.company.id);
      formData.append('startWorkingTime', values.startWorkingTime);
      formData.append('endWorkingTime', values.endWorkingTime);
      formData.append('lineId', values.lineId);
      formData.append('department', values.department);

      toast.promise(createStaff(formData), {
        loading: t('toast.loading'),
        success: (response: CreateStaffResponse) => {
          setActionType('create_user');
          setTitle(t('staffManagement.newUser'));
          setMsg(t('staffManagement.confirmMsgNewUser'));
          setVisibleConfirmationDialog(true);
          setNewStaffId(response.data.id);
          return t('staffManagement.createStaffSuccess');
        },
        error: (error) => t('staffManagement.createStaffFailed') + error.message
      });
    }
  });
  return (
    <Page>
      <PageTitle title={t('staffManagement.action.create')} />
      <Wrapper>
        <Stack
          direction={{ xs: 'column', sm: 'row' }}
          spacing={1}
          useFlexGap
          sx={{
            mt: 1,
            justifyContent: { sm: 'flex-end' }, // right-align when in row
            alignItems: { xs: 'flex-end', sm: 'center' } // right-align when stacked
          }}>
          <Button
            fullWidth={isDownSm}
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
          <Button
            fullWidth={isDownSm}
            variant="contained"
            className="btn-amber-orange"
            onClick={() => {
              setActionType('clear');
              setTitle(t('message.clearDataTitle'));
              setMsg(t('message.clearDataMsg'));
              setVisibleConfirmationDialog(true);
            }}
            startIcon={<Cancel />}>
            {t('button.clear')}
          </Button>
          <Button
            fullWidth={isDownSm}
            variant="contained"
            className="btn-emerald-green"
            onClick={() => {
              setActionType('create');
              setTitle(t('staffManagement.newStaff'));
              setMsg(t('staffManagement.confirmMsgNewStaff'));
              setVisibleConfirmationDialog(true);
            }}
            startIcon={<Save />}>
            {t('button.create')}
          </Button>
        </Stack>
      </Wrapper>
      <Wrapper>
        <Grid container spacing={1}>
          <GridTextField item xs={12} sm={12}>
            <Typography>{t('staffManagement.detail')}</Typography>
          </GridTextField>
          <GridTextField item xs={12} sm={12}>
            <Typography>{t('general.profileImage')}</Typography>
            <ImageFileUploaderWrapper
              id="logo-uploader-id"
              inputId="logo-id"
              isDisabled={false}
              readOnly={false}
              maxFiles={1}
              isMultiple={false}
              onError={() => { }}
              onDeleted={() => {
                setLogoImageFiles([]);
              }}
              onSuccess={(files) => {
                setLogoImageFiles(files);
              }}
              files={logoImageFileUrls}
              fileUploader={FileUploader}
              isError={false}
            />
          </GridTextField>
          <GridTextField item xs={6} sm={6}>
            <TextField
              type="text"
              label={t('staffManagement.column.id')}
              fullWidth
              disabled
              variant="outlined"
              placeholder={t('general.autoGenerated')}
              InputLabelProps={{ shrink: true }}
            />
          </GridTextField>
          <GridTextField item xs={6} sm={6}>
            <TextField
              type="text"
              label={t('staffManagement.column.employeeId') + '*'}
              fullWidth
              onChange={({ target }) => {
                formik.setFieldValue('employeeId', target.value);
              }}
              variant="outlined"
              value={formik.values.employeeId}
              error={Boolean(formik.touched.employeeId && formik.errors.employeeId)}
              helperText={formik.touched.employeeId && formik.errors.employeeId}
              InputLabelProps={{ shrink: true }}
            />
          </GridTextField>
          <GridTextField item xs={12} sm={6}>
            <TextField
              type="text"
              label={t('staffManagement.column.name') + '*'}
              fullWidth
              onChange={({ target }) => {
                formik.setFieldValue('firstName', target.value);
              }}
              variant="outlined"
              value={formik.values.firstName}
              error={Boolean(formik.touched.firstName && formik.errors.firstName)}
              helperText={formik.touched.firstName && formik.errors.firstName}
              InputLabelProps={{ shrink: true }}
            />
          </GridTextField>
          <GridTextField item xs={12} sm={6}>
            <TextField
              type="text"
              label={t('staffManagement.column.lastname') + '*'}
              fullWidth
              onChange={({ target }) => {
                formik.setFieldValue('lastName', target.value);
              }}
              variant="outlined"
              value={formik.values.lastName}
              error={Boolean(formik.touched.lastName && formik.errors.lastName)}
              helperText={formik.touched.lastName && formik.errors.lastName}
              InputLabelProps={{ shrink: true }}
            />
          </GridTextField>
          <GridTextField item xs={12} sm={6}>
            <TextField
              type="text"
              label={t('staffManagement.column.nickname') + '*'}
              fullWidth
              onChange={({ target }) => {
                formik.setFieldValue('nickname', target.value);
              }}
              variant="outlined"
              value={formik.values.nickname}
              error={Boolean(formik.touched.nickname && formik.errors.nickname)}
              helperText={formik.touched.nickname && formik.errors.nickname}
              InputLabelProps={{ shrink: true }}
            />
          </GridTextField>
          <GridTextField item xs={12} sm={6}>
            <TextField
              type="text"
              label={t('staffManagement.column.telNo')}
              fullWidth
              onChange={({ target }) => {
                formik.setFieldValue('telNo', target.value);
              }}
              variant="outlined"
              value={formik.values.telNo}
              error={Boolean(formik.touched.telNo && formik.errors.telNo)}
              helperText={formik.touched.telNo && formik.errors.telNo}
              InputLabelProps={{ shrink: true }}
            />
          </GridTextField>
          <GridTextField item xs={12} sm={6}>
            <TextField
              type="text"
              label={t('staffManagement.column.lineId')}
              fullWidth
              onChange={({ target }) => {
                formik.setFieldValue('lineId', target.value);
              }}
              variant="outlined"
              value={formik.values.lineId}
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
                  label={t('staffManagement.column.nationality') + '*'}
                  InputLabelProps={{ shrink: true }}
                  error={Boolean(formik.touched.nationality && formik.errors.nationality)}
                  helperText={formik.touched.nationality && formik.errors.nationality}
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
              disabled={isDepartmentFetching}
              disablePortal
              options={departmentList?.map((option: SystemConfig) => option) || []}
              getOptionLabel={(option: SystemConfig) => option.nameTh}
              sx={{ width: '100%' }}
              value={formik.values.department || null}
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
              options={staffRoleList?.filter(role => role.roleCode !== 'SUPER_ADMIN').map((option: Role) => option) || []}
              getOptionLabel={(option: Role) => option.roleNameTh}
              sx={{ width: '100%' }}
              value={formik.values.roleCode || null}
              onChange={(_event, value, reason) => {
                onAutoCompleteChange('roleCode', value, reason);
              }}
              renderInput={(params) => (
                <TextField
                  {...params}
                  label={t('staffManagement.column.role') + '*'}
                  InputLabelProps={{ shrink: true }}
                  error={Boolean(formik.touched.roleCode && formik.errors.roleCode)}
                  helperText={formik.touched.roleCode && formik.errors.roleCode}
                  inputProps={{
                    ...params.inputProps,
                    readOnly: true // 🔑 Prevents keyboard
                  }}
                />
              )}
            />
          </GridTextField>
          <GridTextField item xs={12} sm={12}>
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
                  label={t('staffManagement.column.company') + '*'}
                  InputLabelProps={{ shrink: true }}
                  error={Boolean(formik.touched.company && formik.errors.company)}
                  helperText={formik.touched.company && formik.errors.company}
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
                  label={t('staffManagement.column.workingspace') + '*'}
                  InputLabelProps={{ shrink: true }}
                  error={Boolean(formik.touched.workspace && formik.errors.workspace)}
                  helperText={formik.touched.workspace && formik.errors.workspace}
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
              disabled={isStaffType2Fetching}
              disablePortal
              options={staffType2List?.map((option) => option) || []}
              getOptionLabel={(option: SystemConfig) => option.nameTh}
              sx={{ width: '100%' }}
              value={formik.values.staffType || null}
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
                // formik.setFieldValue('packTime', date.toDate())
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
          </GridTextField>
          <GridTextField item xs={6} sm={4}>
            <TextField
              type="time"
              label={t('staffManagement.column.endWorkingHour')}
              fullWidth
              variant="outlined"
              InputLabelProps={{ shrink: true }}
              value={formik.values.endWorkingTime}
              onChange={(e) => formik.setFieldValue('endWorkingTime', e.target.value)}
              inputProps={{ step: 300 }} // 5 นาที
            />
          </GridTextField>
          <GridTextField item xs={6} sm={4}>
            <TextField
              type="time"
              label={t('staffManagement.column.startWorkingHour')}
              fullWidth
              variant="outlined"
              InputLabelProps={{ shrink: true }}
              value={formik.values.startWorkingTime}
              onChange={(e) => formik.setFieldValue('startWorkingTime', e.target.value)}
              inputProps={{ step: 300 }} // 5 นาที
            />
          </GridTextField>
        </Grid>
      </Wrapper>
      <Wrapper>
        <Stack
          direction={{ xs: 'column', sm: 'row' }}
          spacing={1}
          useFlexGap
          sx={{
            mt: 1,
            justifyContent: { sm: 'flex-end' }, // right-align when in row
            alignItems: { xs: 'flex-end', sm: 'center' } // right-align when stacked
          }}>
          <Button
            fullWidth={isDownSm}
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
          <Button
            fullWidth={isDownSm}
            variant="contained"
            className="btn-amber-orange"
            onClick={() => {
              setActionType('clear');
              setTitle(t('message.clearDataTitle'));
              setMsg(t('message.clearDataMsg'));
              setVisibleConfirmationDialog(true);
            }}
            startIcon={<Cancel />}>
            {t('button.clear')}
          </Button>
          <Button
            fullWidth={isDownSm}
            variant="contained"
            className="btn-emerald-green"
            onClick={() => {
              setActionType('create');
              setTitle(t('staffManagement.newStaff'));
              setMsg(t('staffManagement.confirmMsgNewStaff'));
              setVisibleConfirmationDialog(true);
            }}
            startIcon={<Save />}>
            {t('button.create')}
          </Button>
        </Stack>
      </Wrapper>
      <ConfirmDialog
        open={visibleConfirmationDialog}
        title={title}
        message={msg}
        confirmText={t('button.confirm')}
        cancelText={t('button.cancel')}
        onConfirm={() => {
          if (actionType === 'create') {
            formik.handleSubmit();
          } else if (actionType === 'create_user') {
            setOpenCreateUserDialog(true);
          } else if (actionType === 'clear') {
            formik.resetForm();
          } else if (actionType === 'back') {
            history.push(ROUTE_PATHS.STAFF_MANAGEMENT);
          }
          setVisibleConfirmationDialog(false);
        }}
        onCancel={() => {
          if (actionType === 'create_user') {
            if (newStaffId !== '') {
              history.push(`/staff/${newStaffId}`);
            } else {
              history.push(ROUTE_PATHS.STAFF_MANAGEMENT);
            }
          } else {
            setVisibleConfirmationDialog(false);
          }
        }}
        isShowCancelButton={true}
        isShowConfirmButton={true}
      />
      <AddNewAdminDialog
        open={openCreateUserDialog}
        staffId={newStaffId}
        company={formik.values.company}
        onClose={() => {
          history.push(ROUTE_PATHS.STAFF_MANAGEMENT);
          setVisibleConfirmationDialog(false);
          setOpenCreateUserDialog(false);
        }}
      />
    </Page>
  );
}

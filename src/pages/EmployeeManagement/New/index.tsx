import { ArrowBackIos, Cancel, Save } from '@mui/icons-material';
import {
  Button,
  Grid,
  MenuItem,
  Stack,
  TextField,
  Typography,
  useMediaQuery,
  useTheme
} from '@mui/material';
import ConfirmDialog from 'components/ConfirmDialog';
import LoadingDialog from 'components/LoadingDialog';
import PageTitle from 'components/PageTitle';
import { GridTextField, Wrapper } from 'components/Styled';
import { useFormik } from 'formik';
import { Page } from 'layout/LayoutRoute';
import { useState } from 'react';
import toast from 'react-hot-toast';
import { useTranslation } from 'react-i18next';
import { useQuery } from 'react-query';
import { useHistory } from 'react-router-dom';
import { ROUTE_PATHS } from 'routes';
import { getSystemConfig } from 'services/Config/config-api';
import { checkExistingEmployeeId, createEmployee } from 'services/Employee/employee-api';
import { CreateEmployeeRequest } from 'services/Employee/employee-type';
import * as Yup from 'yup';

type ActionType = 'back' | 'clear' | 'create' | '';

export default function NewEmployee(): JSX.Element {
  const theme = useTheme();
  const isDownSm = useMediaQuery(theme.breakpoints.down('sm'));
  const history = useHistory();
  const { t } = useTranslation();
  const [actionType, setActionType] = useState<ActionType>('');
  const [title, setTitle] = useState('');
  const [msg, setMsg] = useState('');
  const [visibleConfirmationDialog, setVisibleConfirmationDialog] = useState(false);
  const [isCheckingEmployeeId, setIsCheckingEmployeeId] = useState(false);
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

  const formik = useFormik<CreateEmployeeRequest>({
    initialValues: {
      employeeId: '',
      firstNameTh: '',
      lastNameTh: '',
      nickName: '',
      position: '',
      phoneNumber: '',
      status: 'ACTIVE',
      additional: '',
      team: ''
    },
    validationSchema: Yup.object().shape({
      employeeId: Yup.string().required(t('employeeManagement.validation.employeeId')),
      firstNameTh: Yup.string().required(t('employeeManagement.validation.firstNameTh')),
      lastNameTh: Yup.string().required(t('employeeManagement.validation.lastNameTh')),
      nickName: Yup.string().required(t('employeeManagement.validation.nickName')),
      position: Yup.string().required(t('employeeManagement.validation.position')),
      phoneNumber: Yup.string().required(t('employeeManagement.validation.phoneNumber')),
      status: Yup.string().required(t('employeeManagement.validation.status')),
      team: Yup.string().required(t('employeeManagement.validation.team'))
    }),
    onSubmit: (values, actions) => {
      actions.setSubmitting(true);

      const createPromise = createEmployee(values);

      toast.promise(createPromise, {
        loading: t('toast.loading'),
        success: () => {
          history.push(ROUTE_PATHS.EMPLOYEE_MANAGEMENT);
          return t('employeeManagement.message.createSuccess');
        },
        error: t('employeeManagement.message.createFailed')
      });

      createPromise.finally(() => {
        actions.setSubmitting(false);
      });
    }
  });

  const handleEmployeeIdBlur = async () => {
    formik.setFieldTouched('employeeId', true);
    await formik.validateField('employeeId');

    const employeeId = formik.values.employeeId.trim();
    if (!employeeId) return;

    setIsCheckingEmployeeId(true);
    try {
      const exists = await checkExistingEmployeeId(employeeId);

      if (exists) {
        formik.setFieldError('employeeId', t('employeeManagement.validation.employeeIdDuplicate'));
      } else if (formik.errors.employeeId === t('employeeManagement.validation.employeeIdDuplicate')) {
        formik.setFieldError('employeeId', undefined);
      }
    } finally {
      setIsCheckingEmployeeId(false);
    }
  };

  return (
    <Page>
      <LoadingDialog open={formik.isSubmitting} />
      <PageTitle title={t('employeeManagement.createTitle')} />
      <Wrapper>
        <Stack
          direction={{ xs: 'column', sm: 'row' }}
          spacing={1}
          useFlexGap
          sx={{
            mt: 1,
            justifyContent: { sm: 'flex-end' },
            alignItems: { xs: 'flex-end', sm: 'center' }
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
              setTitle(t('employeeManagement.action.create'));
              setMsg(t('employeeManagement.message.confirmCreate'));
              setVisibleConfirmationDialog(true);
            }}
            startIcon={<Save />}>
            {t('button.create')}
          </Button>
        </Stack>
      </Wrapper>

      <Wrapper>
        <Grid container spacing={1}>
          <GridTextField item xs={12}>
            <Typography variant="subtitle1" fontWeight={600}>
              {t('employeeManagement.createTitle')}
            </Typography>
          </GridTextField>

          <GridTextField item xs={12} sm={6}>
            <TextField
              name="employeeId"
              label={t('employeeManagement.column.employeeId')}
              fullWidth
              value={formik.values.employeeId}
              onChange={(event) => {
                formik.handleChange(event);
                if (formik.errors.employeeId === t('employeeManagement.validation.employeeIdDuplicate')) {
                  formik.setFieldError('employeeId', undefined);
                }
              }}
              onBlur={handleEmployeeIdBlur}
              error={Boolean(formik.touched.employeeId && formik.errors.employeeId)}
              helperText={
                (formik.touched.employeeId && formik.errors.employeeId) ||
                (isCheckingEmployeeId ? t('toast.loading') : '')
              }
              InputLabelProps={{ shrink: true }}
            />
          </GridTextField>

          <GridTextField item xs={12} sm={6}>
            <TextField
              name="nickName"
              label={t('employeeManagement.column.nickName')}
              fullWidth
              value={formik.values.nickName}
              onChange={formik.handleChange}
              onBlur={formik.handleBlur}
              error={Boolean(formik.touched.nickName && formik.errors.nickName)}
              helperText={formik.touched.nickName && formik.errors.nickName}
              InputLabelProps={{ shrink: true }}
            />
          </GridTextField>

          <GridTextField item xs={12} sm={6}>
            <TextField
              name="firstNameTh"
              label={t('employeeManagement.column.firstName')}
              fullWidth
              value={formik.values.firstNameTh}
              onChange={formik.handleChange}
              onBlur={formik.handleBlur}
              error={Boolean(formik.touched.firstNameTh && formik.errors.firstNameTh)}
              helperText={formik.touched.firstNameTh && formik.errors.firstNameTh}
              InputLabelProps={{ shrink: true }}
            />
          </GridTextField>

          <GridTextField item xs={12} sm={6}>
            <TextField
              name="lastNameTh"
              label={t('employeeManagement.column.lastName')}
              fullWidth
              value={formik.values.lastNameTh}
              onChange={formik.handleChange}
              onBlur={formik.handleBlur}
              error={Boolean(formik.touched.lastNameTh && formik.errors.lastNameTh)}
              helperText={formik.touched.lastNameTh && formik.errors.lastNameTh}
              InputLabelProps={{ shrink: true }}
            />
          </GridTextField>

          <GridTextField item xs={12} sm={6}>
            <TextField
              name="phoneNumber"
              label={t('employeeManagement.column.phoneNumber')}
              fullWidth
              value={formik.values.phoneNumber}
              onChange={formik.handleChange}
              onBlur={formik.handleBlur}
              error={Boolean(formik.touched.phoneNumber && formik.errors.phoneNumber)}
              helperText={formik.touched.phoneNumber && formik.errors.phoneNumber}
              InputLabelProps={{ shrink: true }}
            />
          </GridTextField>

          <GridTextField item xs={12} sm={6}>
            <TextField
              name="position"
              select
              label={t('employeeManagement.column.position')}
              fullWidth
              value={formik.values.position}
              onChange={formik.handleChange}
              onBlur={formik.handleBlur}
              error={Boolean(formik.touched.position && formik.errors.position)}
              helperText={formik.touched.position && formik.errors.position}
              InputLabelProps={{ shrink: true }}
              disabled={isPositionFetching}>
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
              name="team"
              select
              label={t('employeeManagement.column.team')}
              fullWidth
              value={formik.values.team}
              onChange={formik.handleChange}
              onBlur={formik.handleBlur}
              error={Boolean(formik.touched.team && formik.errors.team)}
              helperText={formik.touched.team && formik.errors.team}
              InputLabelProps={{ shrink: true }}
              disabled={isTeamFetching}>
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
              name="additional"
              label={t('employeeManagement.column.additional')}
              fullWidth
              multiline
              minRows={3}
              value={formik.values.additional}
              onChange={formik.handleChange}
              onBlur={formik.handleBlur}
              InputLabelProps={{ shrink: true }}
            />
          </GridTextField>
        </Grid>
      </Wrapper>

      <ConfirmDialog
        open={visibleConfirmationDialog}
        title={title}
        message={msg}
        confirmText={t('button.confirm')}
        cancelText={t('button.cancel')}
        onConfirm={() => {
          if (actionType === 'back') {
            history.push(ROUTE_PATHS.EMPLOYEE_MANAGEMENT);
          } else if (actionType === 'clear') {
            formik.resetForm();
          } else if (actionType === 'create') {
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

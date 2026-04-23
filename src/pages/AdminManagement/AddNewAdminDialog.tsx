import {
  Button,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  MenuItem,
  TextField
} from '@mui/material';
import { useTranslation } from 'react-i18next';
import { useFormik } from 'formik';
import * as Yup from 'yup';
import toast from 'react-hot-toast';
import { useState } from 'react';
import { GridTextField } from 'components/Styled';
import ConfirmDialog from 'components/ConfirmDialog';
import { useQuery } from 'react-query';
import { CreateNewUserRequest } from 'services/User/user-type';
import { createUser, getAllUserRole } from 'services/User/user-api';
import { Company } from 'services/Company/company-type';
import { Cancel, Save } from '@mui/icons-material';

interface AddNewAdminDialogProps {
  open: boolean;
  staffId?: string;
  company?: Company | null | undefined;
  onClose: () => void;
}

export default function AddNewAdminDialog(props: AddNewAdminDialogProps): JSX.Element {
  const { open, staffId, company, onClose } = props;
  const [visibleConfirmationDialog, setVisibleConfirmationDialog] = useState(false);
  const { t } = useTranslation();
  const [showPassword, setShowPassword] = useState(false);
  const togglePasswordVisibility = () => {
    setShowPassword((prev) => !prev);
  };
  const { data: roleList, isFetching: fetchingRole } = useQuery('role-list', () =>
    getAllUserRole()
  );
  const formik = useFormik({
    initialValues: {
      role: '',
      email: '',
      company: company
    },
    validationSchema: Yup.object().shape({
      role: Yup.string().max(255).required(t('userManagement.createNewUser.rolePlaceholder')),
      email: Yup.string()
        .email(t('userManagement.createNewUser.emailInvalid'))
        .max(255)
        .required(t('userManagement.createNewUser.emailPlaceholder'))
    }),
    enableReinitialize: true,
    onSubmit: (values, actions) => {
      actions.setSubmitting(true);
      toast.promise(
        createUser({
          email: values.email,
          role: values.role,
          staffId: staffId,
          companyIdList: [values.company?.id]
        } as CreateNewUserRequest),
        {
          loading: t('toast.loading'),
          success: () => {
            actions.resetForm();
            actions.setSubmitting(false);
            setVisibleConfirmationDialog(false);
            onClose();
            return t('userManagement.createNewUser.createSuccess');
          },
          error: (error) => t('userManagement.createNewUser.createFailure') + ' : ' + error.message
        }
      );
    }
  });
  const generateRandomPassword = (length = 8): string => {
    const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZabcdefghijkmnopqrstuvwxyz0123456789!@$%&';
    let password = '';

    if (window.crypto && window.crypto.getRandomValues) {
      const array = new Uint32Array(length);
      window.crypto.getRandomValues(array);
      for (let i = 0; i < length; i++) {
        password += chars[array[i] % chars.length];
      }
    } else {
      // fallback เผื่อกรณีไม่มี crypto (เช่น browser เก่ามาก)
      for (let i = 0; i < length; i++) {
        password += chars.charAt(Math.floor(Math.random() * chars.length));
      }
    }

    return password;
  };
  const handleGeneratePassword = () => {
    const pwd = generateRandomPassword(8);
    formik.setFieldValue('password', pwd);
    formik.setFieldTouched('password', true, false);
  };
  return (
    <Dialog open={open} fullWidth aria-labelledby="form-dialog-title">
      <DialogTitle id="form-dialog-title">{t('userManagement.createNewUser.title')}</DialogTitle>
      <DialogContent>
        <GridTextField item xs={12}>
          <TextField
            type="text"
            name="name"
            label={t('staffManagement.column.id')}
            fullWidth
            variant="outlined"
            value={staffId}
            InputLabelProps={{ shrink: true }}
          />
        </GridTextField>
        <GridTextField item xs={12}>
          <TextField
            type="email"
            name="email"
            placeholder={t('userManagement.createNewUser.emailPlaceholder')}
            label={t('userManagement.createNewUser.email')}
            fullWidth
            variant="outlined"
            value={formik.values.email}
            error={Boolean(formik.touched.email && formik.errors.email)}
            helperText={formik.touched.email && formik.errors.email}
            onChange={({ target }) => formik.setFieldValue('email', target.value)}
            InputLabelProps={{ shrink: true }}
          />
        </GridTextField>
        {/* <GridTextField item xs={12}>
          <TextField
            type="password"
            name="password"
            placeholder={t('userManagement.createNewUser.passwordPlaceholder')}
            id="netflix_add_password"
            label={t('userManagement.createNewUser.password')}
            fullWidth
            variant="outlined"
            value={formik.values.password}
            error={Boolean(formik.touched.password && formik.errors.password)}
            helperText={formik.touched.password && formik.errors.password}
            onChange={({ target }) => formik.setFieldValue('password', target.value)}
            InputLabelProps={{ shrink: true }}
          /> 
          <Box display="flex" gap={1} alignItems="center">
            <TextField
              type={showPassword ? 'text' : 'password'}
              name="password"
              placeholder={t('userManagement.createNewUser.passwordPlaceholder')}
              id="netflix_add_password"
              label={t('userManagement.createNewUser.password')}
              fullWidth
              variant="outlined"
              value={formik.values.password}
              error={Boolean(formik.touched.password && formik.errors.password)}
              helperText={formik.touched.password && formik.errors.password}
              onChange={({ target }) => formik.setFieldValue('password', target.value)}
              InputLabelProps={{ shrink: true }}
              InputProps={{
                endAdornment: (
                  <InputAdornment position="end">
                    <IconButton onClick={togglePasswordVisibility} edge="end">
                      {showPassword ? <VisibilityOff /> : <Visibility />}
                    </IconButton>
                  </InputAdornment>
                )
              }}
            />

            <Button
              variant="contained"
              onClick={handleGeneratePassword}
              sx={{ whiteSpace: 'nowrap' }}>
              {t('userManagement.createNewUser.generatePassword')}
            </Button>
          </Box>
        </GridTextField> */}
        <GridTextField item xs={12}>
          <TextField
            disabled={fetchingRole}
            select
            label={t('userManagement.createNewUser.role')}
            fullWidth
            variant="outlined"
            value={formik.values.role}
            error={Boolean(formik.touched.role && formik.errors.role)}
            helperText={formik.touched.role && formik.errors.role}
            onChange={({ target }) => formik.setFieldValue('role', target.value)}
            InputLabelProps={{ shrink: true }}>
            {fetchingRole
              ? ' '
              : roleList
                ?.filter((role) => role.roleCode !== 'SUPER_ADMIN')
                .map((role) => (
                  <MenuItem key={role.roleCode} value={role.roleCode}>
                    {t(`role.${role.roleCode}`)}
                  </MenuItem>
                ))}
          </TextField>
        </GridTextField>
        <GridTextField item xs={12}>
          <TextField
            type="text"
            label={t('userManagement.tableHeaders.company')}
            fullWidth
            variant="outlined"
            value={formik.values.company?.nameTh}
            InputLabelProps={{ shrink: true }}
          />
        </GridTextField>
      </DialogContent>
      <DialogActions>
        <Button
          variant="contained"
          className="btn-cool-grey"
          onClick={() => {
            formik.resetForm();
            onClose();
          }}
          startIcon={<Cancel />}>
          {t('button.cancel')}
        </Button>
        <Button
          variant="contained"
          className="btn-emerald-green"
          onClick={() => setVisibleConfirmationDialog(true)}
          startIcon={<Save />}>
          {t('button.create')}
        </Button>
      </DialogActions>
      <ConfirmDialog
        open={visibleConfirmationDialog}
        title={t('userManagement.createNewUser.confirmTitle')}
        message={t('userManagement.createNewUser.confirmMsg')}
        confirmText={t('button.confirm')}
        cancelText={t('button.cancel')}
        onConfirm={() => {
          formik.handleSubmit();
          setVisibleConfirmationDialog(false);
        }}
        onCancel={() => setVisibleConfirmationDialog(false)}
        isShowCancelButton={true}
        isShowConfirmButton={true}
      />
    </Dialog>
  );
}

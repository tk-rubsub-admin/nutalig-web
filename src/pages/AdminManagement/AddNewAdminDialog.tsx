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
import { Cancel, Save } from '@mui/icons-material';

interface AddNewAdminDialogProps {
  open: boolean;
  staffId?: string;
  onClose: () => void;
}

export default function AddNewAdminDialog(props: AddNewAdminDialogProps): JSX.Element {
  const { open, staffId, onClose } = props;
  const [visibleConfirmationDialog, setVisibleConfirmationDialog] = useState(false);
  const { t } = useTranslation();
  const { data: roleList, isFetching: fetchingRole } = useQuery('role-list', () =>
    getAllUserRole()
  );
  const formik = useFormik({
    initialValues: {
      roleCode: ''
    },
    validationSchema: Yup.object().shape({
      roleCode: Yup.string().max(255).required(t('userManagement.createNewUser.rolePlaceholder'))
    }),
    enableReinitialize: true,
    onSubmit: (values, actions) => {
      actions.setSubmitting(true);
      toast.promise(
        createUser({
          roleCode: values.roleCode,
          employeeId: staffId || ''
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
          error: (error) => {
            actions.setSubmitting(false);
            return t('userManagement.createNewUser.createFailure') + ' : ' + error.message;
          }
        }
      );
    }
  });

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
            disabled={fetchingRole}
            select
            label={t('userManagement.createNewUser.role')}
            fullWidth
            variant="outlined"
            value={formik.values.roleCode}
            error={Boolean(formik.touched.roleCode && formik.errors.roleCode)}
            helperText={formik.touched.roleCode && formik.errors.roleCode}
            onChange={({ target }) => formik.setFieldValue('roleCode', target.value)}
            InputLabelProps={{ shrink: true }}>
            {fetchingRole
              ? ' '
              : roleList
                ?.filter((role) => role.roleCode !== 'SUPER_ADMIN')
                .map((role) => (
                  <MenuItem key={role.roleCode} value={role.roleCode}>
                    {role.roleNameTh} ({role.roleCode})
                  </MenuItem>
                ))}
          </TextField>
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
          disabled={!formik.values.roleCode || !staffId}
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

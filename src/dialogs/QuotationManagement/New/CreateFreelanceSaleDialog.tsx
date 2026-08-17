/* eslint-disable prettier/prettier */
import { Add } from '@mui/icons-material';
import { Button, Dialog, DialogActions, DialogContent, DialogTitle, Grid, TextField } from '@mui/material';
import { useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { useQueryClient } from 'react-query';
import toast from 'react-hot-toast';
import LoadingDialog from 'components/LoadingDialog';
import { createFreelanceSale } from 'services/FreelanceSale/freelance-sale-api';
import { CreateFreelanceSaleRequest, FreelanceSaleRecord } from 'services/FreelanceSale/freelance-sale-type';

interface CreateFreelanceSaleDialogProps {
  open: boolean;
  onClose: () => void;
  onCreated: (freelanceSale: FreelanceSaleRecord) => void;
  defaultSaleCoverage?: string | null;
  customerLabel?: string | null;
}

const initialState: CreateFreelanceSaleRequest = {
  id: '',
  name: '',
  contactNumber: '',
  saleCoverage: '',
  additional: ''
};

export default function CreateFreelanceSaleDialog(props: CreateFreelanceSaleDialogProps): JSX.Element {
  const { open, onClose, onCreated, defaultSaleCoverage = '', customerLabel = '' } = props;
  const { t } = useTranslation();
  const queryClient = useQueryClient();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [newFreelanceSale, setNewFreelanceSale] = useState<CreateFreelanceSaleRequest>(initialState);

  useEffect(() => {
    if (!open) return;

    setNewFreelanceSale({
      ...initialState,
      saleCoverage: defaultSaleCoverage || ''
    });
  }, [open, defaultSaleCoverage]);

  const handleCreate = async () => {
    if (!newFreelanceSale.name.trim()) {
      toast.error(t('toast.failed'));
      return;
    }

    setIsSubmitting(true);
    const request = createFreelanceSale({
      name: newFreelanceSale.name.trim(),
      contactNumber: newFreelanceSale.contactNumber?.trim() || '',
      saleCoverage: newFreelanceSale.saleCoverage?.trim() || '',
      additional: newFreelanceSale.additional?.trim() || ''
    });

    toast.promise(request, {
      loading: t('toast.loading'),
      success: () => t('toast.success'),
      error: () => t('toast.failed')
    });

    try {
      const createdFreelanceSale = await request;
      await queryClient.invalidateQueries('quotation-freelance-sales');
      onCreated(createdFreelanceSale);
      onClose();
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Dialog
      open={open}
      onClose={onClose}
      fullWidth
      maxWidth="sm"
    >
      <LoadingDialog open={isSubmitting} />
      <DialogTitle>{`เพิ่ม${t('customerManagement.column.coSalesAccount')}`}</DialogTitle>
      <DialogContent>
        <Grid container spacing={2} sx={{ mt: 0.5 }}>
          <Grid item xs={12}>
            <TextField
              fullWidth
              label="ลูกค้า"
              value={customerLabel || ''}
              InputLabelProps={{ shrink: true }}
              InputProps={{
                readOnly: true
              }}
            />
          </Grid>
          <Grid item xs={12} sm={6}>
            <TextField
              fullWidth
              disabled
              label="ID"
              placeholder="ระบบจะทำการ Generate ให้อัตโนมัติ"
              value={newFreelanceSale.id}
              onChange={(event) => setNewFreelanceSale((prev) => ({ ...prev, id: event.target.value }))}
              InputLabelProps={{ shrink: true }}
            />
          </Grid>
          <Grid item xs={12} sm={6}>
            <TextField
              fullWidth
              required
              label="ชื่อ-นามสกุล"
              value={newFreelanceSale.name}
              onChange={(event) => setNewFreelanceSale((prev) => ({ ...prev, name: event.target.value }))}
              InputLabelProps={{ shrink: true }}
            />
          </Grid>
          <Grid item xs={12} sm={6}>
            <TextField
              fullWidth
              label={t('customerManagement.column.contactNumber')}
              value={newFreelanceSale.contactNumber}
              onChange={(event) => setNewFreelanceSale((prev) => ({ ...prev, contactNumber: event.target.value }))}
              InputLabelProps={{ shrink: true }}
            />
          </Grid>
          <Grid item xs={12} sm={6}>
            <TextField
              fullWidth
              label={t('customerManagement.column.salesAccount')}
              value={newFreelanceSale.saleCoverage}
              onChange={(event) => setNewFreelanceSale((prev) => ({ ...prev, saleCoverage: event.target.value }))}
              InputLabelProps={{ shrink: true }}
            />
          </Grid>
          <Grid item xs={12}>
            <TextField
              fullWidth
              multiline
              minRows={3}
              label="ข้อมูลเพิ่มเติม"
              placeholder="สามารถระบุข้อมูลเพิ่มเติมอื่นๆได้ เช่น ข้อมูลเลขที่บัญชี"
              value={newFreelanceSale.additional}
              onChange={(event) => setNewFreelanceSale((prev) => ({ ...prev, additional: event.target.value }))}
              InputLabelProps={{ shrink: true }}
            />
          </Grid>
        </Grid>
      </DialogContent>
      <DialogActions sx={{ px: 3, pb: 3 }}>
        <Button
          variant="contained"
          className="btn-crimson-red"
          onClick={onClose}>
          {t('button.cancel')}
        </Button>
        <Button
          variant="contained"
          className="btn-indigo-blue"
          onClick={handleCreate}
          startIcon={<Add />}
        >
          เพิ่ม
        </Button>
      </DialogActions>
    </Dialog>
  );
}

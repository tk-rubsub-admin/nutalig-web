import {
  Alert,
  Autocomplete,
  Button,
  CircularProgress,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  Stack,
  TextField,
  Typography
} from '@mui/material';
import LoadingDialog from 'components/LoadingDialog';
import { useEffect, useState } from 'react';
import toast from 'react-hot-toast';
import { useQuery } from 'react-query';
import { searchCustomerByKeyword } from 'services/Customer/customer-api';
import { Customer } from 'services/Customer/customer-type';
import { requestRFQCustomerTransfer } from 'services/RFQ/rfq-api';
import { RFQRecord } from 'services/RFQ/rfq-type';

const label = (customer: Customer) => `(${customer.id}) ${customer.customerName}`;

export default function RequestRFQCustomerTransferDialog({
  open,
  rfq,
  onClose,
  onSubmitted
}: {
  open: boolean;
  rfq?: RFQRecord | null;
  onClose: () => void;
  onSubmitted: () => Promise<void>;
}): JSX.Element {
  const [keyword, setKeyword] = useState('');
  const [debounced, setDebounced] = useState('');
  const [target, setTarget] = useState<Customer | null>(null);
  const [reason, setReason] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const { data: options = [], isFetching } = useQuery(
    ['rfq-transfer-customers', debounced],
    () => searchCustomerByKeyword(debounced, 1, 100),
    { enabled: open && debounced.length > 0, refetchOnWindowFocus: false }
  );
  useEffect(() => {
    if (open) {
      setTarget(null);
      setReason('');
      setKeyword('');
      setDebounced('');
    }
  }, [open]);
  useEffect(() => {
    const timer = window.setTimeout(() => setDebounced(keyword.trim()), 300);
    return () => window.clearTimeout(timer);
  }, [keyword]);
  const submit = async () => {
    if (!rfq?.id || !target?.id || !reason.trim()) return;
    setSubmitting(true);
    try {
      await toast.promise(
        requestRFQCustomerTransfer(rfq.id, { targetCustomerId: target.id, reason: reason.trim() }),
        { loading: 'กำลังส่งคำขอ', success: 'ส่งคำขออนุมัติแล้ว', error: 'ไม่สามารถส่งคำขอได้' }
      );
      await onSubmitted();
      onClose();
    } finally {
      setSubmitting(false);
    }
  };
  return (
    <Dialog
      open={open}
      fullWidth
      maxWidth="sm"
      onClose={() => !submitting && onClose()}
      disableEnforceFocus>
      <LoadingDialog open={submitting} />
      <DialogTitle>เปลี่ยนลูกค้าสำหรับ RFQ นี้</DialogTitle>
      <DialogContent dividers>
        <Stack spacing={2}>
          <TextField
            label="ลูกค้าปัจจุบัน"
            InputLabelProps={{ shrink: true }}
            value={rfq?.customer ? label(rfq.customer as Customer) : '-'}
            InputProps={{ readOnly: true }}
          />
          <Autocomplete
            options={options.filter((item) => item.id !== rfq?.customer?.id)}
            loading={isFetching}
            filterOptions={(items) => items}
            value={target}
            onChange={(_e, value) => setTarget(value)}
            onInputChange={(_e, value, event) => {
              if (event === 'input') setKeyword(value);
            }}
            getOptionLabel={label}
            isOptionEqualToValue={(a, b) => a.id === b.id}
            renderInput={(params) => (
              <TextField
                {...params}
                label="ลูกค้าใหม่"
                helperText="พิมพ์เพื่อค้นหาลูกค้า"
                InputLabelProps={{ shrink: true }}
                InputProps={{
                  ...params.InputProps,
                  endAdornment: (
                    <>
                      {isFetching ? <CircularProgress size={20} /> : null}
                      {params.InputProps.endAdornment}
                    </>
                  )
                }}
              />
            )}
          />
          <TextField
            required
            multiline
            minRows={3}
            label="เหตุผลการเปลี่ยนลูกค้า"
            InputLabelProps={{ shrink: true }}
            value={reason}
            onChange={(e) => setReason(e.target.value)}
          />
          <Alert severity="warning" variant="outlined">
            เมื่ออนุมัติ จะเปลี่ยนเฉพาะลูกค้าใน RFQ เท่านั้น Quotation, Sales Order, Purchase Order
            และเอกสารเดิมจะไม่เปลี่ยนตาม
          </Alert>
        </Stack>
      </DialogContent>
      <DialogActions>
        <Button onClick={onClose}>ยกเลิก</Button>
        <Button
          variant="contained"
          disabled={!target || !reason.trim() || submitting}
          onClick={() => void submit()}>
          ส่งคำขออนุมัติ
        </Button>
      </DialogActions>
    </Dialog>
  );
}

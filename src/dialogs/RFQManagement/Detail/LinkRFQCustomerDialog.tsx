import { Autocomplete, Button, CircularProgress, Dialog, DialogActions, DialogContent, DialogTitle, Stack, TextField, Typography } from '@mui/material';
import LoadingDialog from 'components/LoadingDialog';
import { useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { useQuery } from 'react-query';
import toast from 'react-hot-toast';
import { searchCustomerByKeyword } from 'services/Customer/customer-api';
import { Customer } from 'services/Customer/customer-type';
import { updateRFQCustomer } from 'services/RFQ/rfq-api';
import { RFQRecord } from 'services/RFQ/rfq-type';

interface LinkRFQCustomerDialogProps {
  open: boolean;
  rfq?: RFQRecord | null;
  confirmMessage: string;
  onClose: () => void;
  onUpdated?: (customerId: string) => void | Promise<void>;
}

function getCustomerLabel(customer: Customer): string {
  return `(${customer.id}) ${customer.customerName}`;
}

export default function LinkRFQCustomerDialog({
  open,
  rfq,
  confirmMessage,
  onClose,
  onUpdated
}: LinkRFQCustomerDialogProps): JSX.Element {
  const { t } = useTranslation();
  const [customerKeyword, setCustomerKeyword] = useState('');
  const [debouncedCustomerKeyword, setDebouncedCustomerKeyword] = useState('');
  const [selectedCustomer, setSelectedCustomer] = useState<Customer | null>(rfq?.customer || null);
  const [inputValue, setInputValue] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const { data: customerOptions = [], isFetching: isCustomerFetching } = useQuery(
    ['rfq-link-customer-options', debouncedCustomerKeyword],
    () => searchCustomerByKeyword(debouncedCustomerKeyword, 1, 100),
    {
      enabled: open && debouncedCustomerKeyword.length > 0,
      refetchOnWindowFocus: false
    }
  );

  useEffect(() => {
    if (!open) {
      return;
    }

    const currentCustomer = rfq?.customer || null;
    setSelectedCustomer(currentCustomer);
    setInputValue(currentCustomer ? getCustomerLabel(currentCustomer) : '');
    setCustomerKeyword('');
    setDebouncedCustomerKeyword('');
  }, [open, rfq?.customer?.id, rfq?.customer?.customerName]);

  useEffect(() => {
    const timer = window.setTimeout(() => {
      setDebouncedCustomerKeyword(customerKeyword.trim());
    }, 300);

    return () => window.clearTimeout(timer);
  }, [customerKeyword]);

  const handleClose = () => {
    if (isSubmitting) {
      return;
    }

    onClose();
  };

  const handleConfirm = async () => {
    if (!rfq?.id || !selectedCustomer?.id) {
      return;
    }

    setIsSubmitting(true);
    try {
      await toast.promise(updateRFQCustomer(rfq.id, selectedCustomer.id), {
        loading: t('toast.loading'),
        success: t('toast.success'),
        error: t('toast.failed')
      });

      await onUpdated?.(selectedCustomer.id);
      onClose();
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Dialog open={open} fullWidth maxWidth="sm" disableEnforceFocus onClose={handleClose}>
      <LoadingDialog open={isSubmitting} />
      <DialogTitle>เชื่อมลูกค้ากับ RFQ</DialogTitle>
      <DialogContent dividers>
        <Stack spacing={2}>
          <Typography variant="body2" color="text.secondary">
            {confirmMessage}
          </Typography>
          <Autocomplete
            autoHighlight
            options={customerOptions}
            loading={isCustomerFetching}
            filterOptions={(options) => options}
            value={selectedCustomer}
            inputValue={inputValue}
            onChange={(_event, value) => {
              setSelectedCustomer(value);
              setInputValue(value ? getCustomerLabel(value) : '');
              setCustomerKeyword('');
            }}
            onInputChange={(_event, value, reason) => {
              setInputValue(value);

              if (reason === 'input') {
                setCustomerKeyword(value);
              }

              if (reason === 'clear') {
                setCustomerKeyword('');
                setSelectedCustomer(null);
              }
            }}
            getOptionLabel={(option: Customer) => getCustomerLabel(option)}
            isOptionEqualToValue={(option, value) => option.id === value.id}
            noOptionsText={
              debouncedCustomerKeyword ? t('rfqManagement.form.noCustomerOptions') : t('rfqManagement.form.customerSearchHelper')
            }
            renderInput={(params) => (
              <TextField
                {...params}
                fullWidth
                label={t('rfqManagement.form.customerId')}
                InputLabelProps={{ shrink: true }}
                helperText={t('rfqManagement.form.customerSearchHelper')}
                InputProps={{
                  ...params.InputProps,
                  endAdornment: (
                    <>
                      {isCustomerFetching ? <CircularProgress color="inherit" size={20} /> : null}
                      {params.InputProps.endAdornment}
                    </>
                  )
                }}
              />
            )}
          />
        </Stack>
      </DialogContent>
      <DialogActions>
        <Button onClick={handleClose} className="btn-crimson-red" variant="contained">
          {t('button.cancel')}
        </Button>
        <Button
          onClick={() => {
            void handleConfirm();
          }}
          className="btn-emerald-green"
          variant="contained"
          disabled={!selectedCustomer?.id || isSubmitting}>
          {t('button.confirm')}
        </Button>
      </DialogActions>
    </Dialog>
  );
}

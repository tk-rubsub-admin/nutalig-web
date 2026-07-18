import { AutoFixHigh } from '@mui/icons-material';
import {
  Button,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  Stack,
  TextField,
  Typography
} from '@mui/material';
import LoadingDialog from 'components/LoadingDialog';
import { ReactElement } from 'react';

interface ExtractSupplierQuoteDialogProps {
  open: boolean;
  supplierName?: string | null;
  supplierMessage: string;
  onSupplierMessageChange: (value: string) => void;
  onClose: () => void;
  onExtract: () => void;
  isSubmitting: boolean;
  title?: string;
  helperText?: string;
  inputLabel?: string;
  inputPlaceholder?: string;
  extractButtonText?: string;
}

export function ExtractSupplierQuoteDialog(
  props: ExtractSupplierQuoteDialogProps
): ReactElement {
  const {
    open,
    supplierName,
    supplierMessage,
    onSupplierMessageChange,
    onClose,
    onExtract,
    isSubmitting,
    title,
    helperText,
    inputLabel,
    inputPlaceholder,
    extractButtonText
  } = props;

  return (
    <Dialog open={open} onClose={isSubmitting ? undefined : onClose} maxWidth="md" fullWidth>
      <LoadingDialog open={isSubmitting} />
      <DialogTitle>{title || 'แปลงข้อความจาก Supplier'}</DialogTitle>
      <DialogContent dividers>
        <Stack spacing={2}>
          <Typography variant="body2" color="text.secondary">
            {helperText ||
              (supplierName
                ? `Supplier: ${supplierName}`
                : 'กรุณาวางข้อความจาก supplier เพื่อให้ AI แปลงเป็น supplier quote')}
          </Typography>
          <TextField
            fullWidth
            multiline
            minRows={12}
            label={inputLabel || 'ข้อความจาก Supplier'}
            value={supplierMessage}
            onChange={(event) => onSupplierMessageChange(event.target.value)}
            InputLabelProps={{ shrink: true }}
            placeholder={
              inputPlaceholder ||
              'วางข้อความจาก supplier ที่มีราคา MOQ package lead time หรือค่าใช้จ่ายเพิ่มเติม'
            }
          />
        </Stack>
      </DialogContent>
      <DialogActions>
        <Button onClick={onClose} disabled={isSubmitting} className="btn-cool-grey">
          ปิด
        </Button>
        <Button
          variant="contained"
          startIcon={<AutoFixHigh />}
          disabled={isSubmitting || !supplierMessage.trim()}
          onClick={onExtract}>
          {extractButtonText || 'แปลงข้อความ'}
        </Button>
      </DialogActions>
    </Dialog>
  );
}

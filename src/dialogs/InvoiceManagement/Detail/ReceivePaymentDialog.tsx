import { Button, Dialog, DialogActions, DialogContent, DialogTitle, MenuItem, Stack, TextField } from '@mui/material';
import FancyFileInput from 'components/FancyFileInput';
import { ReactElement } from 'react';
import { formatNumber } from 'utils/utils';

type ReceivePaymentDialogProps = {
  open: boolean;
  invoiceNo: string;
  paymentDate: string;
  amount: number;
  paymentMethod: 'TRANSFER' | 'CHEQUE' | 'CASH';
  chequeBank: string;
  chequeNo: string;
  chequeDate: string;
  chequeBranch: string;
  slipFiles: File[];
  onClose: () => void;
  onPaymentDateChange: (value: string) => void;
  onPaymentMethodChange: (value: 'TRANSFER' | 'CHEQUE' | 'CASH') => void;
  onChequeBankChange: (value: string) => void;
  onChequeNoChange: (value: string) => void;
  onChequeDateChange: (value: string) => void;
  onChequeBranchChange: (value: string) => void;
  onSlipFilesChange: (files: File[]) => void;
  onSubmit: () => void;
};

export default function ReceivePaymentDialog({
  open,
  invoiceNo,
  paymentDate,
  amount,
  paymentMethod,
  chequeBank,
  chequeNo,
  chequeDate,
  chequeBranch,
  slipFiles,
  onClose,
  onPaymentDateChange,
  onPaymentMethodChange,
  onChequeBankChange,
  onChequeNoChange,
  onChequeDateChange,
  onChequeBranchChange,
  onSlipFilesChange,
  onSubmit
}: ReceivePaymentDialogProps): ReactElement {
  const isTransfer = paymentMethod === 'TRANSFER';
  const isCheque = paymentMethod === 'CHEQUE';
  const isSubmitDisabled =
    !paymentDate ||
    (isTransfer && slipFiles.length === 0) ||
    (isCheque && (!chequeBank || !chequeNo || !chequeDate));

  return (
    <Dialog open={open} onClose={onClose} fullWidth maxWidth="sm">
      <DialogTitle>{'รับชำระเงิน #' + invoiceNo}</DialogTitle>
      <DialogContent dividers>
        <Stack spacing={2}>
          <TextField
            fullWidth
            type="date"
            label="วันที่รับชำระเงิน"
            value={paymentDate}
            onChange={(event) => onPaymentDateChange(event.target.value)}
            InputLabelProps={{ shrink: true }}
          />
          <TextField
            select
            fullWidth
            label="วิธีการชำระเงิน"
            value={paymentMethod}
            onChange={(event) =>
              onPaymentMethodChange(event.target.value as 'TRANSFER' | 'CHEQUE' | 'CASH')
            }>
            <MenuItem value="TRANSFER">โอนเงิน</MenuItem>
            <MenuItem value="CHEQUE">เช็ค</MenuItem>
            <MenuItem value="CASH">เงินสด</MenuItem>
          </TextField>
          <TextField
            fullWidth
            label="จำนวนยอดเงิน"
            value={formatNumber(amount || 0)}
            InputProps={{ readOnly: true }}
            InputLabelProps={{ shrink: true }}
          />
          {isCheque ? (
            <>
              <TextField
                fullWidth
                label="ธนาคารเช็ค"
                value={chequeBank}
                onChange={(event) => onChequeBankChange(event.target.value)}
              />
              <TextField
                fullWidth
                label="เลขที่เช็ค"
                value={chequeNo}
                onChange={(event) => onChequeNoChange(event.target.value)}
              />
              <TextField
                fullWidth
                type="date"
                label="วันที่เช็ค"
                value={chequeDate}
                onChange={(event) => onChequeDateChange(event.target.value)}
                InputLabelProps={{ shrink: true }}
              />
              <TextField
                fullWidth
                label="สาขาเช็ค"
                value={chequeBranch}
                onChange={(event) => onChequeBranchChange(event.target.value)}
              />
            </>
          ) : null}
          {isTransfer ? (
            <FancyFileInput
              fullWidth
              accept="image/*,.pdf"
              value={slipFiles}
              onChange={onSlipFilesChange}
              helperText="แนบไฟล์สลิปโอนเงิน"
            />
          ) : null}
        </Stack>
      </DialogContent>
      <DialogActions>
        <Button variant="contained" className="btn-cool-grey" onClick={onClose}>
          ยกเลิก
        </Button>
        <Button
          variant="contained"
          className="btn-emerald-green"
          onClick={onSubmit}
          disabled={isSubmitDisabled}>
          ยืนยัน
        </Button>
      </DialogActions>
    </Dialog>
  );
}

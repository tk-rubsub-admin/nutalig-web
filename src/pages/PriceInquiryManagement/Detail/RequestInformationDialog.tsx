import {
  Button,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  TextField
} from '@mui/material';
import { ReactElement } from 'react';

interface RequestInformationDialogProps {
  open: boolean;
  requestInformation: string;
  onRequestInformationChange: (value: string) => void;
  onClose: () => void;
  onConfirm: () => void;
  isSubmitting: boolean;
}

export function RequestInformationDialog({
  open,
  requestInformation,
  onRequestInformationChange,
  onClose,
  onConfirm,
  isSubmitting
}: RequestInformationDialogProps): ReactElement {
  return (
    <Dialog open={open} onClose={onClose} maxWidth="sm" fullWidth>
      <DialogTitle>ขอข้อมูลเพิ่มเติม</DialogTitle>
      <DialogContent dividers>
        <TextField
          fullWidth
          multiline
          minRows={5}
          label="รายละเอียดที่ต้องการขอเพิ่มเติม"
          value={requestInformation}
          onChange={(event) => onRequestInformationChange(event.target.value)}
          InputLabelProps={{ shrink: true }}
          placeholder="ระบุรายละเอียดที่ต้องการเพิ่มเติมจากเซลล์/ลูกค้า"
        />
      </DialogContent>
      <DialogActions>
        <Button
          className="btn-crimson-red"
          variant="contained"
          onClick={onClose}
          disabled={isSubmitting}>
          ยกเลิก
        </Button>
        <Button
          className="btn-emerald-green"
          variant="contained"
          onClick={onConfirm}
          disabled={isSubmitting}>
          ยืนยัน
        </Button>
      </DialogActions>
    </Dialog>
  );
}

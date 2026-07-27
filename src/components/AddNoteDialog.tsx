import {
  Button,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  TextField
} from '@mui/material';
import { ReactElement } from 'react';

interface AddNoteDialogProps {
  open: boolean;
  note: string;
  onNoteChange: (value: string) => void;
  onClose: () => void;
  onConfirm: () => void;
  isSubmitting: boolean;
}

export default function AddNoteDialog({
  open,
  note,
  onNoteChange,
  onClose,
  onConfirm,
  isSubmitting
}: AddNoteDialogProps): ReactElement {
  return (
    <Dialog open={open} onClose={onClose} maxWidth="sm" fullWidth>
      <DialogTitle>เพิ่มโน้ต</DialogTitle>
      <DialogContent dividers>
        <TextField
          fullWidth
          multiline
          minRows={5}
          label="รายละเอียดโน้ต"
          value={note}
          onChange={(event) => onNoteChange(event.target.value)}
          InputLabelProps={{ shrink: true }}
          placeholder="ระบุข้อความโน้ตหรือ memo ที่ต้องการบันทึก"
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

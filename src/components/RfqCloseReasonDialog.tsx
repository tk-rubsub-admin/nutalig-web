import {
  Alert,
  Box,
  Button,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  Stack,
  Typography
} from '@mui/material';
import { ReactElement } from 'react';
import { SystemConfig } from 'services/Config/config-type';

interface RfqCloseReasonDialogProps {
  open: boolean;
  closeReason?: SystemConfig | null;
  closeRemark?: string | null;
  onClose: () => void;
}

export default function RfqCloseReasonDialog({
  open,
  closeReason,
  closeRemark,
  onClose
}: RfqCloseReasonDialogProps): ReactElement {
  const reasonLabel = closeReason?.nameTh || closeReason?.nameEn || closeReason?.code || '-';

  return (
    <Dialog open={open} onClose={onClose} fullWidth maxWidth="sm">
      <DialogTitle>เหตุผลการปิดงาน RFQ</DialogTitle>
      <DialogContent dividers>
        <Stack spacing={2}>
          <Alert severity="info">รายละเอียดเหตุผลที่ใช้ปิดงาน RFQ</Alert>
          <Box>
            <Typography variant="body2" color="text.secondary" gutterBottom>
              เหตุผลการปิดงาน
            </Typography>
            <Typography variant="body1" fontWeight={600}>
              {reasonLabel}
            </Typography>
          </Box>
          <Box>
            <Typography variant="body2" color="text.secondary" gutterBottom>
              เหตุผลที่ระบุเพิ่มเติม
            </Typography>
            <Typography variant="body1" sx={{ whiteSpace: 'pre-wrap' }}>
              {closeRemark?.trim() || '-'}
            </Typography>
          </Box>
        </Stack>
      </DialogContent>
      <DialogActions>
        <Button className="btn-baby-blue" variant="contained" onClick={onClose}>
          ปิด
        </Button>
      </DialogActions>
    </Dialog>
  );
}

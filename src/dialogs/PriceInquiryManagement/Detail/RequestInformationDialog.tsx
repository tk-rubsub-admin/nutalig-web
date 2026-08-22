import {
  MenuItem,
  Button,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  TextField,
  Grid
} from '@mui/material';
import { GridTextField } from 'components/Styled';
import { ReactElement } from 'react';
import { RequestInfoTo, RFQEmployee } from 'services/RFQ/rfq-type';

interface RequestInformationDialogProps {
  open: boolean;
  requestInformation: string;
  requestTo: RequestInfoTo;
  requestToSales: RFQEmployee | null;
  requestToProcurement: RFQEmployee | null;
  onRequestInformationChange: (value: string) => void;
  onRequestToChange: (value: RequestInfoTo) => void;
  onClose: () => void;
  onConfirm: () => void;
  isSubmitting: boolean;
}

export function RequestInformationDialog({
  open,
  requestInformation,
  requestTo,
  requestToSales,
  requestToProcurement,
  onRequestInformationChange,
  onRequestToChange,
  onClose,
  onConfirm,
  isSubmitting
}: RequestInformationDialogProps): ReactElement {
  const selectedRequestToUser =
    requestTo === RequestInfoTo.OWNER
      ? requestToSales
      : requestTo === RequestInfoTo.PROCUREMENT
        ? requestToProcurement
        : null;

  const getEmployeeLabel = (employee: RFQEmployee | null) => {
    return (
      employee?.name ||
      employee?.nickName ||
      employee?.firstNameTh ||
      employee?.employeeId ||
      '-'
    );
  };

  return (
    <Dialog open={open} onClose={onClose} maxWidth="sm" fullWidth>
      <DialogTitle>ขอข้อมูลเพิ่มเติม</DialogTitle>
      <DialogContent dividers>
        <Grid container spacing={1}>
          <GridTextField item xs={12} sm={12}>
            <TextField
              fullWidth
              select
              label="ส่งไปที่"
              value={requestTo}
              onChange={(event) => onRequestToChange(event.target.value as RequestInfoTo)}
              InputLabelProps={{ shrink: true }}
            >
              <MenuItem value={RequestInfoTo.OWNER}>
                {`เซลล์ที่ดูแล : ${getEmployeeLabel(requestToSales)}`}
              </MenuItem>
              <MenuItem value={RequestInfoTo.PROCUREMENT}>
                {`จัดซื้อที่ดูแล : ${getEmployeeLabel(requestToProcurement)}`}
              </MenuItem>
              <MenuItem value={RequestInfoTo.ALL}>ทั้งเซลล์และจัดซื้อ</MenuItem>
            </TextField>
          </GridTextField>
          <GridTextField item xs={12} sm={12}>
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
          </GridTextField>
        </Grid>
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

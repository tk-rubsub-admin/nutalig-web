import InfoOutlined from '@mui/icons-material/InfoOutlined';
import {
  Alert,
  Box,
  Button,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  Divider,
  Paper,
  Stack,
  Typography
} from '@mui/material';
import dayjs from 'dayjs';
import { ReactElement, useMemo } from 'react';

interface RequestInformationEntry {
  requestInformation?: string;
  requestedBy?: string;
  requestedDate?: string;
}

interface RequestedInformationDialogProps {
  open: boolean;
  requestInformation: string | null | undefined;
  onClose: () => void;
}

function parseRequestInformation(requestInformation: string | null | undefined): RequestInformationEntry[] {
  if (!requestInformation) {
    return [];
  }

  try {
    const parsed = JSON.parse(requestInformation);
    if (Array.isArray(parsed)) {
      return parsed as RequestInformationEntry[];
    }
  } catch (error) {
    return [];
  }

  return [];
}

function formatRequestedDate(requestedDate?: string): string {
  if (!requestedDate) {
    return '-';
  }

  const formattedDate = dayjs(requestedDate);
  if (!formattedDate.isValid()) {
    return requestedDate;
  }

  return formattedDate.format('DD/MM/YYYY HH:mm:ss');
}

export function RequestedInformationDialog({
  open,
  requestInformation,
  onClose
}: RequestedInformationDialogProps): ReactElement {
  const requestEntries = useMemo(
    () => parseRequestInformation(requestInformation).slice().reverse(),
    [requestInformation]
  );

  const fallbackMessage =
    typeof requestInformation === 'string' && requestInformation.trim()
      ? requestInformation
      : '-';

  return (
    <Dialog open={open} onClose={onClose} maxWidth="sm" fullWidth>
      <DialogTitle sx={{ pb: 1 }}>
        <Stack direction="row" spacing={1.5} alignItems="center">
          <Box>
            <Typography variant="h6" component="div">
              ต้องการข้อมูลเพิ่มเติม
            </Typography>
          </Box>
        </Stack>
      </DialogTitle>
      <DialogContent dividers>
        <Stack spacing={2}>
          <Alert severity="info" icon={<InfoOutlined fontSize="inherit" />}>
            กรุณาตรวจสอบรายละเอียดที่ถูกขอเพิ่มเติมด้านล่าง
          </Alert>

          {requestEntries.length > 0 ? (
            <Stack spacing={1.5}>
              {requestEntries.map((entry, index) => (
                <Paper key={`${entry.requestedDate || index}`} variant="outlined" sx={{ p: 2 }}>
                  <Stack spacing={1}>
                    <Stack direction="row" justifyContent="space-between" spacing={2}>
                      <Typography variant="subtitle2" color="text.secondary">
                        ครั้งที่ {requestEntries.length - index}
                      </Typography>
                      <Typography variant="caption" color="text.secondary">
                        {formatRequestedDate(entry.requestedDate)}
                      </Typography>
                    </Stack>
                    <Divider />
                    <Typography variant="body2" sx={{ whiteSpace: 'pre-wrap' }}>
                      {entry.requestInformation || '-'}
                    </Typography>
                    {entry.requestedBy ? (
                      <Typography variant="caption" color="text.secondary">
                        ถามเพิ่มเติมโดย: {entry.requestedBy}
                      </Typography>
                    ) : null}
                  </Stack>
                </Paper>
              ))}
            </Stack>
          ) : (
            <Paper variant="outlined" sx={{ p: 2 }}>
              <Typography variant="body2" sx={{ whiteSpace: 'pre-wrap' }}>
                {fallbackMessage}
              </Typography>
            </Paper>
          )}
        </Stack>
      </DialogContent>
      <DialogActions>
        <Button className="btn-baby-blue" variant="contained" onClick={onClose}>
          รับทราบ
        </Button>
      </DialogActions>
    </Dialog>
  );
}

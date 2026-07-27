import CommentOutlined from '@mui/icons-material/CommentOutlined';
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

interface NoteEntry {
  note?: string;
  notedBy?: string;
  notedDate?: string;
}

interface ViewNoteDialogProps {
  open: boolean;
  note: string | null | undefined;
  onClose: () => void;
}

function parseNoteEntries(note: string | null | undefined): NoteEntry[] {
  if (!note) {
    return [];
  }

  try {
    const parsed = JSON.parse(note);
    if (Array.isArray(parsed)) {
      return parsed as NoteEntry[];
    }
  } catch (error) {
    return [];
  }

  return [];
}

function formatNotedDate(notedDate?: string): string {
  if (!notedDate) {
    return '-';
  }

  const formattedDate = dayjs(notedDate);
  if (!formattedDate.isValid()) {
    return notedDate;
  }

  return formattedDate.format('DD/MM/YYYY HH:mm:ss');
}

export default function ViewNoteDialog({
  open,
  note,
  onClose
}: ViewNoteDialogProps): ReactElement {
  const noteEntries = useMemo(() => parseNoteEntries(note).slice().reverse(), [note]);

  const fallbackMessage = typeof note === 'string' && note.trim() ? note : '-';

  return (
    <Dialog open={open} onClose={onClose} maxWidth="sm" fullWidth>
      <DialogTitle sx={{ pb: 1 }}>
        <Stack direction="row" spacing={1.5} alignItems="center">
          <Box>
            <Typography variant="h6" component="div">
              โน้ต
            </Typography>
          </Box>
        </Stack>
      </DialogTitle>
      <DialogContent dividers>
        <Stack spacing={2}>
          <Alert severity="info" icon={<CommentOutlined fontSize="inherit" />}>
            กรุณาตรวจสอบรายละเอียดโน้ตด้านล่าง
          </Alert>

          {noteEntries.length > 0 ? (
            <Stack spacing={1.5}>
              {noteEntries.map((entry, index) => (
                <Paper key={`${entry.notedDate || index}`} variant="outlined" sx={{ p: 2 }}>
                  <Stack spacing={1}>
                    <Stack direction="row" justifyContent="space-between" spacing={2}>
                      <Typography variant="subtitle2" color="text.secondary">
                        ครั้งที่ {noteEntries.length - index}
                      </Typography>
                      <Typography variant="caption" color="text.secondary">
                        {formatNotedDate(entry.notedDate)}
                      </Typography>
                    </Stack>
                    <Divider />
                    <Typography variant="body2" sx={{ whiteSpace: 'pre-wrap' }}>
                      {entry.note || '-'}
                    </Typography>
                    {entry.notedBy ? (
                      <Typography variant="caption" color="text.secondary">
                        บันทึกโดย: {entry.notedBy}
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

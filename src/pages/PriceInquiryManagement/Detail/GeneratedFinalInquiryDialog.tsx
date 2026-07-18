import { ContentCopy } from '@mui/icons-material';
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
import { ReactElement } from 'react';
import { copyText } from 'utils/copyContent';

export interface GeneratedFinalInquiryDialogProps {
  open: boolean;
  message: string;
  onClose: () => void;
  t: (key: string) => string;
}

export function GeneratedFinalInquiryDialog(
  props: GeneratedFinalInquiryDialogProps
): ReactElement {
  const { open, message, onClose, t } = props;

  return (
    <Dialog open={open} onClose={onClose} maxWidth="md" fullWidth>
      <DialogTitle>{t('priceInquiryManagement.generateFinalInquiry.title')}</DialogTitle>
      <DialogContent dividers>
        <Stack spacing={1.5}>
          <Stack direction="row" justifyContent="space-between" alignItems="center" useFlexGap>
            <Typography variant="subtitle1" fontWeight={700}>
              {t('priceInquiryManagement.generateFinalInquiry.messageLabel')}
            </Typography>
            <Button
              size="small"
              variant="outlined"
              startIcon={<ContentCopy />}
              onClick={() => copyText(message || '')}>
              {t('button.copy')}
            </Button>
          </Stack>
          <TextField fullWidth multiline minRows={14} value={message} InputProps={{ readOnly: true }} />
        </Stack>
      </DialogContent>
      <DialogActions>
        <Button variant="contained" onClick={onClose}>
          {t('button.close')}
        </Button>
      </DialogActions>
    </Dialog>
  );
}

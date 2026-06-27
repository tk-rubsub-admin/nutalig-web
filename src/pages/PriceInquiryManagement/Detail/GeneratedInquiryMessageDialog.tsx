import { ContentCopy } from '@mui/icons-material';
import {
  Button,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  Stack,
  TextField,
  Typography,
  Box
} from '@mui/material';
import { ReactElement } from 'react';
import { copyText } from 'utils/copyContent';
import { RFQInquiryMessage } from 'services/RFQ/rfq-type';

export interface GeneratedInquiryMessageDialogProps {
  open: boolean;
  generatedInquiryMessage: RFQInquiryMessage | null;
  thaiMessage: string;
  chineseMessage: string;
  isEdited: boolean;
  onThaiMessageChange: (value: string) => void;
  onChineseMessageChange: (value: string) => void;
  onRequestUpdate: () => void;
  onClose: () => void;
  t: (key: string) => string;
}

export function GeneratedInquiryMessageDialog(
  props: GeneratedInquiryMessageDialogProps
): ReactElement {
  const {
    open,
    generatedInquiryMessage,
    thaiMessage,
    chineseMessage,
    isEdited,
    onThaiMessageChange,
    onChineseMessageChange,
    onRequestUpdate,
    onClose,
    t
  } = props;

  return (
    <Dialog open={open} onClose={onClose} maxWidth="md" fullWidth>
      <DialogTitle>{t('priceInquiryManagement.generateInquiry.title')}</DialogTitle>
      <DialogContent dividers>
        <Stack spacing={3}>
          <Box>
            <Stack direction="row" justifyContent="space-between" alignItems="center" sx={{ mb: 1 }}>
              <Typography variant="subtitle1" fontWeight={700}>
                {t('priceInquiryManagement.generateInquiry.thaiMessage')}
              </Typography>
              <Button
                size="small"
                variant="outlined"
                startIcon={<ContentCopy />}
                onClick={() => copyText(thaiMessage || generatedInquiryMessage?.thaiMessage || '')}>
                {t('button.copy')}
              </Button>
            </Stack>
            <TextField
              fullWidth
              multiline
              minRows={8}
              value={thaiMessage}
              onChange={(event) => onThaiMessageChange(event.target.value)}
            />
          </Box>
          <Box>
            <Stack direction="row" justifyContent="space-between" alignItems="center" sx={{ mb: 1 }}>
              <Typography variant="subtitle1" fontWeight={700}>
                {t('priceInquiryManagement.generateInquiry.chineseMessage')}
              </Typography>
              <Button
                size="small"
                variant="outlined"
                startIcon={<ContentCopy />}
                onClick={() =>
                  copyText(chineseMessage || generatedInquiryMessage?.chineseMessage || '')
                }>
                {t('button.copy')}
              </Button>
            </Stack>
            <TextField
              fullWidth
              multiline
              minRows={8}
              value={chineseMessage}
              onChange={(event) => onChineseMessageChange(event.target.value)}
            />
          </Box>
        </Stack>
      </DialogContent>
      <DialogActions>
        <Button variant="contained" onClick={onClose}>
          {t('button.close')}
        </Button>
        <Button
          variant="contained"
          color="secondary"
          disabled={!isEdited}
          onClick={onRequestUpdate}>
          {t('button.update')}
        </Button>
      </DialogActions>
    </Dialog>
  );
}

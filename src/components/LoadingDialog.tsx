import { Box, Dialog, DialogContent, Typography } from '@mui/material';
import { useTranslation } from 'react-i18next';

interface LoadingDialogProps {
  open: boolean;
}

export default function LoadingDialog(props: LoadingDialogProps): JSX.Element {
  const { t } = useTranslation();
  const { open } = props;
  return (
    <Dialog
      open={open}
      aria-labelledby="loading-dialog-title"
      PaperProps={{ sx: { backgroundColor: '#FFFFFF' } }}>
      <DialogContent>
        <Box
          sx={{
            display: 'flex',
            justifyContent: 'center',
            alignItems: 'center'
          }}>
          <Box
            component="img"
            src="/nutalig-loading.svg"
            alt=""
            sx={{ width: 280, maxWidth: '100%', height: 'auto', display: 'block' }}
          />
        </Box>
        <br />
        <Typography id="loading-dialog-title" align="center">{t('toast.loading')}</Typography>
      </DialogContent>
    </Dialog>
  );
}

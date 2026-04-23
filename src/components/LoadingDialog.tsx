import { Box, CircularProgress, Dialog, DialogContent, Typography } from '@mui/material';
import { useTranslation } from 'react-i18next';

interface LoadingDialogProps {
  open: boolean;
}

export default function LoadingDialog(props: LoadingDialogProps): JSX.Element {
  const { t } = useTranslation();
  const { open } = props;
  return (
    <Dialog open={open} aria-labelledby="form-dialog-title">
      <DialogContent>
        <Box
          sx={{
            display: 'flex',
            justifyContent: 'center',
            alignItems: 'center'
          }}>
          <CircularProgress />
        </Box>
        <br />
        <Typography sx={{ display: 'flex' }}>{t('toast.loading')}</Typography>
      </DialogContent>
    </Dialog>
  );
}

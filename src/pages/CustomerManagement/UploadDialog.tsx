import { CloudUpload, Close } from '@mui/icons-material';
import {
  Alert,
  Box,
  Button,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  LinearProgress,
  Stack,
  Typography
} from '@mui/material';
import FancyFileInput from 'components/FancyFileInput';
import { useEffect, useMemo, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { uploadCustomers } from 'services/Customer/customer-api';
import { UploadCustomerResponse } from 'services/Customer/customer-type';

interface UploadDialogProps {
  open: boolean;
  onClose: () => void;
  onUploaded?: () => void;
}

export default function UploadDialog({ open, onClose, onUploaded }: UploadDialogProps): JSX.Element {
  const { t } = useTranslation();
  const [files, setFiles] = useState<File[]>([]);
  const [isUploading, setIsUploading] = useState(false);
  const [progress, setProgress] = useState(0);
  const [result, setResult] = useState<UploadCustomerResponse | null>(null);
  const [errorMessage, setErrorMessage] = useState('');

  const selectedFile = useMemo(() => files[0] ?? null, [files]);

  useEffect(() => {
    if (!open) {
      setFiles([]);
      setIsUploading(false);
      setProgress(0);
      setResult(null);
      setErrorMessage('');
    }
  }, [open]);

  const handleClose = () => {
    if (isUploading) {
      return;
    }
    onClose();
  };

  const handleUpload = async () => {
    if (!selectedFile) {
      setErrorMessage(t('inputUpload.invalidType'));
      return;
    }

    setErrorMessage('');
    setResult(null);
    setIsUploading(true);
    setProgress(0);

    try {
      const response = await uploadCustomers(selectedFile, setProgress);
      setResult(response);
      onUploaded?.();
    } catch (error: any) {
      const message =
        error?.response?.data?.message ||
        error?.response?.data?.error ||
        error?.message ||
        'อัปโหลดข้อมูลลูกค้าไม่สำเร็จ';
      setErrorMessage(message);
    } finally {
      setIsUploading(false);
    }
  };

  return (
    <Dialog open={open} fullWidth maxWidth="sm" aria-labelledby="customer-upload-dialog-title">
      <DialogTitle id="customer-upload-dialog-title">
        <Box display="flex" alignItems="center" justifyContent="space-between" gap={2}>
          <Typography variant="h6">{t('inputUpload.title')}</Typography>
          <Typography variant="body2" color="text.secondary">
            {t('inputUpload.subTitle')}
          </Typography>
        </Box>
      </DialogTitle>
      <DialogContent>
        <Stack spacing={2} sx={{ pt: 1 }}>
          <FancyFileInput
            helperText={t('inputUpload.helperText')}
            accept=".xlsx,application/vnd.openxmlformats-officedocument.spreadsheetml.sheet"
            multiple={false}
            disabled={isUploading}
            required
            fullWidth
            value={files}
            onChange={setFiles}
          />

          {isUploading && (
            <Stack spacing={1}>
              <Typography variant="body2" color="text.secondary">
                กำลังอัปโหลด {progress}%
              </Typography>
              <LinearProgress variant="determinate" value={progress} />
            </Stack>
          )}

          {result && (
            <Alert severity="success">
              อัปโหลดสำเร็จ {result.createdCount} รายการ, ข้าม {result.skippedCount} รายการ, ล้มเหลว{' '}
              {result.failedCount} รายการ
            </Alert>
          )}

          {errorMessage && <Alert severity="error">{errorMessage}</Alert>}
        </Stack>
      </DialogContent>
      <DialogActions>
        <Button
          onClick={handleClose}
          variant="outlined"
          startIcon={<Close />}
          disabled={isUploading}>
          {t('button.close')}
        </Button>
        <Button
          onClick={handleUpload}
          variant="contained"
          className="btn-emerald-green"
          startIcon={<CloudUpload />}
          disabled={isUploading || !selectedFile}>
          {isUploading ? 'กำลังอัปโหลด...' : t('inputUpload.submitButton')}
        </Button>
      </DialogActions>
    </Dialog>
  );
}

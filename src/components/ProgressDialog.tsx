/* eslint-disable prettier/prettier */
import {
    Box,
    Button,
    Dialog,
    DialogActions,
    DialogContent,
    DialogTitle,
    LinearProgress,
    Typography
} from '@mui/material';
import { useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
import ConfirmDialog from './ConfirmDialog';
import { getJobStatus } from 'services/general-api';

interface ProgressDialogProps {
    open: boolean;
    jobId: string;
    onConfirm: () => void;
    onClose: () => void;
}

export default function ProgressDialog(props: ProgressDialogProps): JSX.Element {
    const { open, jobId, onConfirm, onClose } = props;
    const { t } = useTranslation();
    const [progress, setProgress] = useState(0);
    const [progressed, setProgressed] = useState(0);
    const [total, setTotal] = useState(0);
    const [visibleConfirmationDialog, setVisibleConfirmationDialog] = useState(false);

    useEffect(() => {
        let timer: NodeJS.Timeout | null = null;
        if (open && jobId) {
            // reset when opening
            setProgress(0);
            setProgressed(0);
            setTotal(0);
            setVisibleConfirmationDialog(false);

            timer = setInterval(async () => {
                const res = await getJobStatus(jobId);

                setProgressed(res.processed);
                setTotal(res.total);
                if (res.total > 0) {
                    const percentage = (res.processed / res.total) * 100;
                    setProgress(Math.min(percentage, 100)); // ensure max 100
                }

                // Optional: auto-close when done
                if (res.processed >= res.total) {
                    clearInterval(timer);
                    setProgress(100);
                    // onClose(); // uncomment if you want to close automatically
                }
            }, 1000);
        }

        return () => {
            if (timer) clearInterval(timer);
        };
    }, [open, jobId]);

    return (
        <Dialog open={open} fullWidth aria-labelledby="form-dialog-title">
            <DialogTitle>
                <Typography variant="h3">{t('upload.jobId', { jobId })}</Typography>
            </DialogTitle>
            <DialogContent>
                <br />
                <Typography variant="h4">
                    {t('upload.processing', {
                        processed: progressed,
                        totalOrder: total
                    })}
                </Typography>
                <br />
                <Box sx={{ width: '100%' }}>
                    <LinearProgress variant="determinate" value={progress} />
                </Box>
            </DialogContent>
            <DialogActions>
                <Button
                    onClick={() => {
                        setVisibleConfirmationDialog(true);
                    }}
                    color="primary"
                    variant="outlined">
                    {t('button.close')}
                </Button>
                {progress >= 100 ? (
                    <Button
                        onClick={() => {
                            setProgress(0);
                            setProgressed(0);
                            setTotal(0);
                            onConfirm();
                        }}
                        color="primary"
                        variant="contained">
                        {t('button.confirm')}
                    </Button>
                ) : (
                    <></>
                )}
            </DialogActions>
            <ConfirmDialog
                open={visibleConfirmationDialog}
                title={t('upload.closePopupTitle')}
                message={t('upload.closePopupMsg')}
                confirmText={t('button.confirm')}
                cancelText={t('button.cancel')}
                onConfirm={() => {
                    setProgress(0);
                    setProgressed(0);
                    setTotal(0);
                    onClose();
                    setVisibleConfirmationDialog(false);
                }}
                onCancel={() => setVisibleConfirmationDialog(false)}
                isShowCancelButton={true}
                isShowConfirmButton={true}
            />
        </Dialog>
    );
}

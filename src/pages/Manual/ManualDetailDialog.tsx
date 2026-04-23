/* eslint-disable prettier/prettier */
import { useEffect, useState } from 'react';
import {
    Box,
    Dialog,
    DialogContent,
    DialogTitle,
    CircularProgress,
    Typography,
    Stack,
} from '@mui/material';
import { ManualDto } from 'services/Manual/manual-type';
import { getManualById } from 'services/Manual/manual-api';
import { useTranslation } from 'react-i18next';

interface ManualDialogProps {
    open: boolean;
    manualId: string | null;
    onClose: () => void;
}

export default function ManualDetailDialog({
    open,
    manualId,
    onClose,
}: ManualDialogProps) {
    const { t } = useTranslation();
    const [manual, setManual] = useState<ManualDto | null>(null);
    const [manualDetail, setManualDetail] = useState('');
    const [loading, setLoading] = useState(false);

    useEffect(() => {
        if (!open || !manualId) return;

        fetchManual(manualId);
    }, [open, manualId]);

    const fetchManual = async (id: string) => {
        setLoading(true);
        try {
            // 1️⃣ load manual info
            const manualData = await getManualById(id);
            setManual(manualData);

            // 2️⃣ load txt detail
            try {
                const res = await fetch(`/manuals/${id}.txt`);
                const text = await res.text();
                setManualDetail(text);
            } catch {
                setManualDetail(t('manual.noManualDetail'));
            }
        } catch (e) {
            console.error(e);
            setManual(null);
            setManualDetail(t('manual.notFound'));
        } finally {
            setLoading(false);
        }
    };

    return (
        <Dialog
            open={open}
            onClose={onClose}
            fullWidth
            maxWidth="md"
        >
            <DialogTitle>
                {manual?.name ?? 'คู่มือการใช้งาน'}
            </DialogTitle>

            <DialogContent dividers sx={{ p: 0 }}>
                {loading ? (
                    <Stack alignItems="center" py={4}>
                        <CircularProgress />
                    </Stack>
                ) : (
                    <>
                        {/* ===== VIDEO ===== */}
                        {manual?.videoLink && (
                            <Box
                                sx={{
                                    position: 'relative',
                                    paddingTop: '56.25%',
                                    backgroundColor: '#000',
                                }}
                            >
                                <Box
                                    component="video"
                                    controls
                                    src={manual.videoLink}
                                    sx={{
                                        position: 'absolute',
                                        inset: 0,
                                        width: '100%',
                                        height: '100%',
                                    }}
                                />
                            </Box>
                        )}

                        {/* ===== DETAIL ===== */}
                        <Box sx={{ p: 2 }}>
                            <Typography
                                component="pre"
                                sx={{
                                    whiteSpace: 'pre-wrap',
                                    fontFamily: 'inherit',
                                    fontSize: 14,
                                    lineHeight: 1.8,
                                }}
                            >
                                {manualDetail}
                            </Typography>
                        </Box>
                    </>
                )}
            </DialogContent>
        </Dialog>
    );
}
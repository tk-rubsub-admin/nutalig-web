/* eslint-disable prettier/prettier */
import { Close } from '@mui/icons-material';
import { Button, Dialog, DialogActions, DialogContent, DialogTitle, Stack, Typography } from '@mui/material';
import { ReactNode } from 'react';
import { useTranslation } from 'react-i18next';
import { TemplateLanguage } from 'services/Document/document-type';

export interface DocumentLanguageDialogProps {
    open: boolean;
    title?: ReactNode;
    description?: ReactNode;
    onClose: () => void;
    onSelect: (language: TemplateLanguage) => void;
}

export default function DocumentLanguageDialog({
    open,
    title,
    description,
    onClose,
    onSelect
}: DocumentLanguageDialogProps): JSX.Element {
    const { t } = useTranslation();

    return (
        <Dialog open={open} onClose={onClose} maxWidth="xs" fullWidth>
            <DialogTitle>{title || 'เลือกภาษาเอกสาร'}</DialogTitle>
            <DialogContent>
                <Stack spacing={1} sx={{ pt: 1 }}>
                    <Typography variant="body2" color="text.secondary">
                        {description || 'กรุณาเลือกภาษาสำหรับแสดงผลเอกสาร'}
                    </Typography>
                    <Stack direction={{ xs: 'column', sm: 'row' }} spacing={1.5} sx={{ pt: 1 }}>
                        <Button
                            fullWidth
                            variant="contained"
                            className="btn-indigo-blue"
                            startIcon={<span aria-hidden="true" style={{ fontSize: '1.35rem', lineHeight: 1 }}>🇹🇭</span>}
                            onClick={() => onSelect('TH')}>
                            ภาษาไทย
                        </Button>
                        <Button
                            fullWidth
                            variant="contained"
                            className="btn-indigo-blue"
                            startIcon={<span aria-hidden="true" style={{ fontSize: '1.35rem', lineHeight: 1 }}>🇬🇧</span>}
                            onClick={() => onSelect('EN')}>
                            ภาษาอังกฤษ
                        </Button>
                    </Stack>
                </Stack>
            </DialogContent>
        </Dialog>
    );
}

/* eslint-disable prettier/prettier */
import * as React from 'react';
import { Button, Typography, Stack, FormHelperText } from '@mui/material';
import CloudUploadIcon from '@mui/icons-material/CloudUpload';
import CheckCircleIcon from '@mui/icons-material/CheckCircle';
import { styled } from '@mui/material/styles';
import { useTranslation } from 'react-i18next';

type FancyFileInputProps = {
    helperText?: string; // ข้อความช่วย/คำอธิบาย
    accept?: string; // ex: "image/*,.csv"
    multiple?: boolean; // เลือกได้หลายไฟล์
    disabled?: boolean;
    required?: boolean;
    error?: boolean;
    fullWidth?: boolean;
    // controlled (ถ้าอยากควบคุมจากภายนอก)
    value?: File[]; // รายชื่อไฟล์ที่เลือกไว้
    onChange?: (files: File[]) => void; // ส่งไฟล์กลับเมื่อเปลี่ยน
};

const Dropzone = styled('div', {
    shouldForwardProp: (prop) => !['dragActive', 'error', 'disabled'].includes(String(prop))
})<{ dragActive?: boolean; error?: boolean; disabled?: boolean }>(
    ({ theme, dragActive, error, disabled }) => ({
        position: 'relative',
        border: '2px dashed',
        borderColor: error
            ? theme.palette.error.main
            : dragActive
                ? theme.palette.primary.main
                : theme.palette.divider,
        borderRadius: theme.shape.borderRadius * 2,
        background: dragActive
            ? theme.palette.action.hover
            : theme.palette.mode === 'light'
                ? '#fafafa'
                : theme.palette.background.paper,
        padding: theme.spacing(3),
        transition: 'border-color .2s, background .2s',
        outline: 'none',
        cursor: disabled ? 'not-allowed' : 'pointer',
        opacity: disabled ? 0.6 : 1
    })
);

const HiddenInput = styled('input')({
    position: 'absolute',
    inset: 0,
    width: '100%',
    height: '100%',
    opacity: 0,
    cursor: 'pointer'
});

const FileTag = styled('div')(({ theme }) => ({
    display: 'inline-flex',
    alignItems: 'center',
    gap: 6,
    padding: '6px 10px',
    borderRadius: 999,
    border: `1px solid ${theme.palette.divider}`,
    background: theme.palette.background.default,
    fontSize: 12
}));

function formatBytes(size?: number) {
    if (!size && size !== 0) return '';
    const units = ['B', 'KB', 'MB', 'GB'];
    let n = size;
    let i = 0;
    while (n >= 1024 && i < units.length - 1) {
        n /= 1024;
        i++;
    }
    return `${n.toFixed(n < 10 && i > 0 ? 1 : 0)} ${units[i]}`;
}

export default function FancyFileInput({
    helperText,
    accept,
    multiple,
    disabled,
    required,
    error,
    fullWidth,
    value,
    onChange
}: FancyFileInputProps) {
    const { t } = useTranslation();
    const [internalFiles, setInternalFiles] = React.useState<File[]>([]);
    const files = value ?? internalFiles;

    const [dragActive, setDragActive] = React.useState(false);

    const handleFiles = (list: FileList | null) => {
        if (!list) return;
        const arr = Array.from(list);
        const next = multiple ? [...arr] : arr.slice(0, 1);
        if (!value) setInternalFiles(next);
        onChange?.(next);
    };

    const onDrop = (e: React.DragEvent<HTMLDivElement>) => {
        e.preventDefault();
        e.stopPropagation();
        setDragActive(false);
        if (disabled) return;
        handleFiles(e.dataTransfer.files);
    };

    const onDragOver = (e: React.DragEvent<HTMLDivElement>) => {
        e.preventDefault();
        e.stopPropagation();
        if (!disabled) setDragActive(true);
    };

    const onDragLeave = (e: React.DragEvent<HTMLDivElement>) => {
        e.preventDefault();
        e.stopPropagation();
        setDragActive(false);
    };

    return (
        <Stack spacing={0.75} sx={{ width: fullWidth ? '100%' : 'auto' }}>
            <Dropzone
                role="button"
                tabIndex={0}
                dragActive={dragActive}
                error={error}
                disabled={disabled}
                onDrop={onDrop}
                onDragOver={onDragOver}
                onDragLeave={onDragLeave}
                onKeyDown={(e) => {
                    if ((e.key === 'Enter' || e.key === ' ') && !disabled) {
                        // click hidden input ผ่าน button
                        (e.currentTarget.querySelector('input[type=file]') as HTMLInputElement)?.click();
                    }
                }}>
                <Stack direction="row" alignItems="center" spacing={2}>
                    <Button
                        variant="contained"
                        startIcon={<CloudUploadIcon />}
                        className="btn-baby-blue"
                        disableElevation
                        disabled={disabled}
                        component="span"
                        sx={{ pointerEvents: 'none' }} // ป้องกันซ้อนกับ HiddenInput
                    >
                        {t('inputUpload.chooseFileButton')}
                    </Button>

                    <Stack spacing={0} sx={{ minWidth: 0, flex: 1 }}>
                        {files.length > 0 ? (
                            <>
                                <Typography variant="body2" noWrap>
                                    {files.map((f) => f.name).join(', ')}
                                </Typography>
                                <Typography variant="caption" color="text.secondary">
                                    {files.length} ไฟล์ •{' '}
                                    {files.reduce((s, f) => s + f.size, 0)
                                        ? formatBytes(files.reduce((s, f) => s + f.size, 0))
                                        : ''}
                                </Typography>
                            </>
                        ) : (
                            <Typography variant="body2" color="text.secondary" noWrap>
                                {t('inputUpload.helperTextV2')}
                            </Typography>
                        )}
                    </Stack>

                    {files.length > 0 && <CheckCircleIcon color="success" />}
                </Stack>

                {/* อินพุตจริง (ซ่อน) ครอบเต็ม dropzone เพื่อคลิกได้ทั้งกล่อง */}
                <HiddenInput
                    type="file"
                    accept={accept}
                    multiple={multiple}
                    disabled={disabled}
                    onChange={(e) => handleFiles(e.currentTarget.files)}
                />
            </Dropzone>

            {helperText && <FormHelperText error={error}>{helperText}</FormHelperText>}

            {/* รายการไฟล์แบบแท็กเล็ก ๆ (optional/สวยงาม) */}
            {files.length > 0 && (
                <Stack direction="row" flexWrap="wrap" gap={1} mt={0.5}>
                    {files.map((f, idx) => (
                        <FileTag key={idx} title={`${f.name} (${formatBytes(f.size)})`}>
                            {f.name} • {formatBytes(f.size)}
                        </FileTag>
                    ))}
                </Stack>
            )}
        </Stack>
    );
}

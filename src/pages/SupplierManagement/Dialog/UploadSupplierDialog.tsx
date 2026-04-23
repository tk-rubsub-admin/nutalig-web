/* eslint-disable prettier/prettier */

import { Check, Close } from "@mui/icons-material";
import { Box, Button, Dialog, DialogActions, DialogContent, DialogTitle, Grid, Typography } from "@mui/material";
import ConfirmDialog from "components/ConfirmDialog";
import FancyFileInput from "components/FancyFileInput";
import { GridTextField } from "components/Styled";
import { useCallback, useState } from "react";
import toast from "react-hot-toast";
import { useTranslation } from "react-i18next";
import { downloadTemplate } from "services/Product/product-api";
import { uploadSupplier } from "services/Supplier/supplier-api";

export interface UploadSupplierDialogProps {
    open: boolean,
    onSuccess: () => void;
    onClose: () => void;
}

export default function UploadSupplierDialog(props: UploadSupplierDialogProps): JSX.Element {
    const { open, onSuccess, onClose } = props;
    const { t } = useTranslation();
    const [visibleConfirmationDialog, setVisibleConfirmationDialog] = useState(false);
    const [title, setTitle] = useState<string>('');
    const [msg, setMsg] = useState<string>('');
    const [action, setAction] = useState<string>('');
    const [file, setFile] = useState();

    const onFancyInputChange = useCallback((files: File[]) => {
        setFile(files?.[0] ?? null);       // ✅ เก็บไฟล์แรก (หรือ null ถ้าไม่มี)
    }, []);

    const handleConfirmUpload = async () => {
        const formData = new FormData()
        formData.append('file', file);

        toast.promise(uploadSupplier(formData),
            {
                loading: t('toast.loading'),
                success: () => {
                    onSuccess();
                    onClose();
                    return t('productManagement.productList.importSuccess')
                },
                error: (error) => t('productManagement.productList.importFailed') + error.message,
            }
        ).finally(() => {
            setVisibleConfirmationDialog(false)
        })
    }

    const handleDownloadTemplate = (templateId: string) => {
        toast.promise(downloadTemplate(templateId), {
            loading: t('toast.loading'),
            success: (response) => {
                // Create a temporary URL for the Blob
                const blob = response.data;
                const url = window.URL.createObjectURL(blob);

                const contentDisposition = response.headers['content-disposition'];

                let filename = 'template.xlsx';
                console.log("Download file size " + blob.size);
                if (contentDisposition) {
                    const match = contentDisposition.match(/filename\*?=(?:UTF-8'')?(.+)/);
                    if (match?.[1]) {
                        filename = decodeURIComponent(match[1].replace(/"/g, ''));
                    }
                }
                // Create a temporary <a> element to trigger the download
                const tempLink = document.createElement('a');
                tempLink.href = url;
                tempLink.setAttribute('download', filename); // Set the desired filename for the downloaded file

                // Append the <a> element to the body and click it to trigger the download
                document.body.appendChild(tempLink);
                tempLink.click();

                // Clean up the temporary elements and URL
                document.body.removeChild(tempLink);
                window.URL.revokeObjectURL(url);
                return t('toast.success');
            },
            error: () => {
                return t('toast.failed');
            }
        });
    };

    return (
        <Dialog open={open} maxWidth="xs" fullWidth aria-labelledby="form-dialog-title" >
            <DialogTitle id="form-dialog-title">
                <Box display="flex" justifyContent="space-between" alignItems="center">
                    <Typography variant="h6">
                        {t('supplierManagement.uploadData')}
                    </Typography>
                    <Typography
                        variant="subtitle2"
                        onClick={() => {
                            handleDownloadTemplate('TEMPL-00003');
                        }}
                        style={{ cursor: 'pointer', color: '#1976d2' }} // ทำให้เหมือนลิงก์
                    >
                        {t('productManagement.productSupplier.downloadTemplate')}
                    </Typography>
                </Box>
            </DialogTitle>
            <DialogContent>
                <br />
                <Grid container spacing={1}>
                    <GridTextField item xs={12} sm={12}>
                        <FancyFileInput
                            helperText="รองรับไฟล์ .csv, .xlsx ขนาดไม่เกิน 10MB"
                            accept=".csv, application/vnd.openxmlformats-officedocument.spreadsheetml.sheet, application/vnd.ms-excel"
                            multiple={false}
                            fullWidth
                            required
                            onChange={onFancyInputChange}
                        />
                    </GridTextField>
                </Grid>
            </DialogContent>
            <DialogActions>
                <Button
                    onClick={() => {
                        onClose();
                    }}
                    variant="contained"
                    startIcon={<Close />}
                    className="btn-cool-grey">
                    {t('button.close')}
                </Button>
                <Button
                    variant="contained"
                    startIcon={<Check />}
                    className="btn-emerald-green"
                    onClick={() => {
                        setTitle(t('supplierManagement.message.confirmUploadTitle'));
                        setMsg(t('supplierManagement.message.confirmUploadMsg'));
                        setAction('SUBMIT');
                        setVisibleConfirmationDialog(true);
                        setVisibleConfirmationDialog(true)
                    }}
                >
                    {t('button.importStocks')}
                </Button>
            </DialogActions>
            <ConfirmDialog
                open={visibleConfirmationDialog}
                title={title}
                message={msg}
                confirmText={t('button.confirm')}
                cancelText={t('button.cancel')}
                onConfirm={() => {
                    if (action === 'SUBMIT') {
                        handleConfirmUpload();
                    }
                    setVisibleConfirmationDialog(false);
                }}
                onCancel={() => setVisibleConfirmationDialog(false)}
                isShowCancelButton={true}
                isShowConfirmButton={true}
            />
        </Dialog>
    );
}
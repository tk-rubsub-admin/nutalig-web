/* eslint-disable prettier/prettier */
import { Close, ImageOutlined, PictureAsPdf, Print } from '@mui/icons-material';
import {
    Button,
    Dialog,
    DialogActions,
    DialogContent,
    DialogTitle,
    Divider,
    ListItemIcon,
    ListItemText,
    Menu,
    MenuItem
} from '@mui/material';
import { useState } from 'react';
import toast from 'react-hot-toast';
import { useTranslation } from 'react-i18next';
import { viewQuotation } from 'services/Document/document-api';
import { Quotation } from 'services/Document/document-type';
import { base64ToBlob } from 'utils';

/* eslint-disable prettier/prettier */
export interface ViewQuotationDialogProps {
    open: boolean;
    url: string;
    quotationNo: string;
    quotation: Quotation
    options: { original: boolean, copy: boolean };
    onClose: () => void;
}

export default function ViewQuotationDialog(props: ViewQuotationDialogProps): JSX.Element {
    const { open, url, quotationNo, quotation, options, onClose } = props;
    const { t } = useTranslation();
    const [anchorEl, setAnchorEl] = useState<null | HTMLElement>(null);
    const openMenu = Boolean(anchorEl);

    const handleOpen = (e: MouseEvent<HTMLButtonElement>) => {
        if (!quotation) return; // กัน null
        setAnchorEl(e.currentTarget);
    };

    const handleClose = () => setAnchorEl(null);

    const downloadQuotationFunction = (quo: Quotation, format: string) => {

        const request = viewQuotation(quo.quotationNo, options.original, options.copy);

        toast.promise(request, {
            loading: t('toast.loading'),
            success: (response) => {
                const data = response.data as {
                    format: 'PDF' | 'JPG';
                    files: {
                        fileName: string;
                        base64: string;
                    }[];
                };

                // ================= PDF (ไฟล์เดียว) =================
                if (format === 'PDF') {
                    const file = data.files[0];
                    const blob = base64ToBlob(file.base64, 'application/pdf');
                    const url = window.URL.createObjectURL(blob);

                    const link = document.createElement('a');
                    link.href = url;
                    link.download = file.fileName;
                    link.click();

                    window.URL.revokeObjectURL(url);
                }

                // ================= JPG (หลายไฟล์) =================
                if (format === 'JPG') {
                    data.files.forEach(file => {
                        const blob = base64ToBlob(file.base64, 'image/jpeg');
                        const url = window.URL.createObjectURL(blob);

                        const link = document.createElement('a');
                        link.href = url;
                        link.download = file.fileName;
                        link.click();

                        window.URL.revokeObjectURL(url);
                    });
                }
                return t('toast.success');
            },
            error: () => {
                return t('toast.failed');
            }
        });

    };

    return (
        <Dialog open={open} maxWidth="sm" fullWidth aria-labelledby="form-dialog-title">
            <DialogTitle id="form-dialog-title">
                {t('documentManagement.quotation.viewQuotationTitle', { docNo: quotationNo })}
            </DialogTitle>
            <DialogContent>
                <iframe
                    ref={(el) => {
                        if (el) {
                            el.onload = () => {
                                const iframeDoc = el.contentDocument || el.contentWindow?.document;
                                if (iframeDoc) {
                                    const leftMenu = iframeDoc.querySelector('.left-menu-class'); // replace with actual selector
                                    const topMenu = iframeDoc.querySelector('.top-menu-class'); // replace with actual selector
                                    if (leftMenu) leftMenu.style.display = 'none';
                                    if (topMenu) topMenu.style.display = 'none';
                                }
                            };
                        }
                    }}
                    src={url}
                    width="100%"
                    height="600px"
                    style={{ border: 'none' }}
                />
            </DialogContent>
            <DialogActions>
                <>
                    <Button
                        style={{ display: quotation === undefined ? 'none' : '' }}
                        onClick={handleOpen}
                        variant="contained"
                        startIcon={<Print />}
                        className="btn-green-teal"
                        disabled={!quotation}
                        aria-controls={openMenu ? 'download-po-menu' : undefined}
                        aria-haspopup="true"
                        aria-expanded={openMenu ? 'true' : undefined}>
                        {t('documentManagement.quotation.downloadQuotation')}
                    </Button>

                    <Menu
                        id="download-po-menu"
                        anchorEl={anchorEl}
                        open={openMenu}
                        onClose={handleClose}
                        anchorOrigin={{ vertical: 'bottom', horizontal: 'left' }}
                        transformOrigin={{ vertical: 'top', horizontal: 'left' }}
                        keepMounted>
                        <MenuItem onClick={() => downloadQuotationFunction(quotation, 'PDF')}>
                            <ListItemIcon>
                                <PictureAsPdf fontSize="small" />
                            </ListItemIcon>
                            <ListItemText primary={t('general.downloadAsPDF')} />
                        </MenuItem>

                        <Divider />

                        <MenuItem onClick={() => downloadQuotationFunction(quotation, 'JPG')}>
                            <ListItemIcon>
                                <ImageOutlined fontSize="small" />
                            </ListItemIcon>
                            <ListItemText primary={t('general.downloadAsJPG')} />
                        </MenuItem>
                    </Menu>
                </>
                <Button
                    onClick={() => onClose()}
                    variant="contained"
                    startIcon={<Close />}
                    className="btn-cool-grey">
                    {t('button.close')}
                </Button>
            </DialogActions>
        </Dialog>
    )
}
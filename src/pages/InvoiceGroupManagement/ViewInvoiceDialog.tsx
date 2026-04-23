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
import { downloadInvoice } from 'services/Invoice/invoice-api';
import { Invoice, InvoiceGroup } from 'services/Invoice/invoice-type';
import { base64ToBlob } from 'utils';


export interface ViewInvoiceDialogProps {
    open: boolean;
    url: string;
    invNo: string;
    invoice?: Invoice | InvoiceGroup;
    options: { original: boolean, copy: boolean };
    onClose: () => void;
}

export default function ViewInvoiceDialog(props: ViewInvoiceDialogProps): JSX.Element {
    const { open, url, invNo, invoice, options, onClose } = props;
    const { t } = useTranslation();
    const [anchorEl, setAnchorEl] = useState<null | HTMLElement>(null);
    const openMenu = Boolean(anchorEl);

    const handleOpen = (e: MouseEvent<HTMLButtonElement>) => {
        if (!invoice) return; // กัน null
        setAnchorEl(e.currentTarget);
    };

    const handleClose = () => setAnchorEl(null);

    const downloadPurchaseOrderFunction = (inv: Invoice, format: string) => {
        toast.promise(downloadInvoice(inv.invoiceNo, format, options.original, options.copy), {
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
                {invNo === null ? t('invoiceManagement.viewInvoice') : t('invoiceManagement.invoiceId') + ' ' + invNo}
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
                        style={{ display: invoice === undefined ? 'none' : '' }}
                        onClick={handleOpen}
                        variant="contained"
                        startIcon={<Print />}
                        className="btn-green-teal"
                        disabled={!invoice}
                        aria-controls={openMenu ? 'download-po-menu' : undefined}
                        aria-haspopup="true"
                        aria-expanded={openMenu ? 'true' : undefined}>
                        {t('invoiceManagement.downloadInvoice')}
                    </Button>

                    <Menu
                        id="download-po-menu"
                        anchorEl={anchorEl}
                        open={openMenu}
                        onClose={handleClose}
                        anchorOrigin={{ vertical: 'bottom', horizontal: 'left' }}
                        transformOrigin={{ vertical: 'top', horizontal: 'left' }}
                        keepMounted>
                        <MenuItem onClick={() => downloadPurchaseOrderFunction(invoice, 'PDF')}>
                            <ListItemIcon>
                                <PictureAsPdf fontSize="small" />
                            </ListItemIcon>
                            <ListItemText primary={t('invoiceManagement.downloadAsPDF')} />
                        </MenuItem>

                        <Divider />

                        <MenuItem onClick={() => downloadPurchaseOrderFunction(invoice, 'JPG')}>
                            <ListItemIcon>
                                <ImageOutlined fontSize="small" />
                            </ListItemIcon>
                            <ListItemText primary={t('invoiceManagement.downloadAsJPG')} />
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
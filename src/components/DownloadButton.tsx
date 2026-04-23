/* eslint-disable prettier/prettier */
import { useState, MouseEvent, useEffect } from 'react';
import { Button, Menu, MenuItem, ListItemIcon, ListItemText, Divider } from '@mui/material';
import { Print, PictureAsPdf, Image, ImageOutlined } from '@mui/icons-material';
import { useTranslation } from 'react-i18next';
import ViewOptionDialog from './ViewOptionDialog';

type ExportFormat = 'PDF' | 'PNG' | 'JPG';

interface Props {
    po?: any;
    isDownSm?: boolean;
    label: string;
    disable?: boolean;
    className?: string;
    title?: string;
    downloadSaleOrderFunction: (
        po: any,
        format: ExportFormat,
        options: { original: boolean; copy: boolean }
    ) => void;
}

export default function DownloadPOButton({
    po,
    isDownSm,
    label,
    disable = false,
    className,
    title,
    downloadSaleOrderFunction,
}: Props) {
    const { t } = useTranslation();

    const [anchorEl, setAnchorEl] = useState<null | HTMLElement>(null);
    const [openOptionDialog, setOpenOptionDialog] = useState(false);
    const [buttonEl, setButtonEl] = useState<null | HTMLElement>(null);

    const [printOriginal, setPrintOriginal] = useState(true);
    const [printCopy, setPrintCopy] = useState(false);

    const openMenu = Boolean(anchorEl);

    /** กดปุ่ม Download */
    const handleButtonClick = (e: MouseEvent<HTMLButtonElement>) => {
        if (!po) return;
        setButtonEl(e.currentTarget); // เก็บ reference ปุ่ม
        setOpenOptionDialog(true);    // เปิด popup
    };

    /** Confirm จาก Dialog */
    const handleConfirmOption = (options: { original: boolean; copy: boolean }) => {
        setPrintOriginal(options.original);
        setPrintCopy(options.copy);
        setOpenOptionDialog(false);

        // เปิด Menu หลัง confirm เท่านั้น
        if (buttonEl) {
            setAnchorEl(buttonEl);
        }
    };

    const handleCloseMenu = () => setAnchorEl(null);

    const handleSelect = (format: ExportFormat) => {
        if (!po) return;
        downloadSaleOrderFunction(po, format, {
            original: printOriginal,
            copy: printCopy,
        });
        handleCloseMenu();
    };

    // useEffect(() => {
    //     if (!openOptionDialog && (printOriginal || printCopy)) {
    //         const fakeEvent = {
    //             currentTarget: document.querySelector('.btn-baby-blue') as HTMLElement,
    //         } as MouseEvent<HTMLButtonElement>;

    //         handleOpenMenu(fakeEvent);
    //     }
    // }, [openOptionDialog]);

    return (
        <>
            {/* Download Button */}
            <Button
                fullWidth={!!isDownSm}
                onClick={handleButtonClick}
                variant="contained"
                startIcon={<Print />}
                className={className}
                disabled={disable}
            >
                {label}
            </Button>

            {/* Popup เลือก ต้นฉบับ / สำเนา */}
            <ViewOptionDialog
                open={openOptionDialog}
                title={t('invoiceManagement.viewDoc')}
                onClose={() => setOpenOptionDialog(false)}
                onConfirm={handleConfirmOption}
            />

            {/* Menu เลือก Format */}
            <Menu
                anchorEl={anchorEl}
                open={openMenu}
                onClose={handleCloseMenu}
                anchorOrigin={{ vertical: 'bottom', horizontal: 'left' }}
                transformOrigin={{ vertical: 'top', horizontal: 'left' }}
            >
                <MenuItem onClick={() => handleSelect('PDF')}>
                    <ListItemIcon>
                        <PictureAsPdf fontSize="small" />
                    </ListItemIcon>
                    <ListItemText primary={t('invoiceManagement.downloadAsPDF')} />
                </MenuItem>

                <Divider />

                <MenuItem onClick={() => handleSelect('JPG')}>
                    <ListItemIcon>
                        <ImageOutlined fontSize="small" />
                    </ListItemIcon>
                    <ListItemText primary={t('invoiceManagement.downloadAsJPG')} />
                </MenuItem>
            </Menu>
        </>
    );
}

/* eslint-disable prettier/prettier */
import { IconButton, Tooltip } from '@mui/material';
import HelpOutline from '@mui/icons-material/HelpOutline';
import { useState } from 'react';
import ManualDetailDialog from './ManualDetailDialog';
import { useTranslation } from 'react-i18next';

interface ManualHelpButtonProps {
    manualId: string;
}

export default function ManualHelpButton({
    manualId,
}: ManualHelpButtonProps) {

    const { t } = useTranslation();
    const [openManual, setOpenManual] = useState(false);

    return (
        <>
            <Tooltip title={t('manual.title')}>
                <IconButton
                    size="small"
                    onClick={(e) => {
                        e.stopPropagation(); // กัน click event ของ parent
                        setOpenManual(true);
                    }}
                    sx={{
                        color: '#FBC02D',
                        '&:hover': {
                            backgroundColor: '#FFF9C4',
                        },
                    }}
                >
                    <HelpOutline />
                </IconButton>
            </Tooltip>
            <ManualDetailDialog
                open={openManual}
                manualId={manualId}
                onClose={() => setOpenManual(false)}
            />
        </>
    );
}
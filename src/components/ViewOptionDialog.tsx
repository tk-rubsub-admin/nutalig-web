/* eslint-disable prettier/prettier */
import React, { useState, useEffect } from 'react';
import {
    Dialog,
    DialogTitle,
    DialogContent,
    DialogActions,
    Button,
    Checkbox,
    FormGroup,
    FormControlLabel,
    Grid
} from '@mui/material';
import { useTranslation } from 'react-i18next';
import { GridTextField } from './Styled';

export type ViewOption = {
    original: boolean;
    copy: boolean;
};

type Props = {
    open: boolean;
    title: string;
    onClose: () => void;
    onConfirm: (options: ViewOption) => void;
    defaultOriginal?: boolean;
    defaultCopy?: boolean;
    children?: React.ReactNode;
};

const ViewOptionDialog: React.FC<Props> = ({
    open,
    title,
    onClose,
    onConfirm,
    defaultOriginal = true,
    defaultCopy = false,
    children
}) => {
    const { t } = useTranslation();

    const [printOriginal, setPrintOriginal] = useState(defaultOriginal);
    const [printCopy, setPrintCopy] = useState(defaultCopy);

    // reset ค่าเมื่อ dialog เปิดใหม่
    useEffect(() => {
        if (open) {
            setPrintOriginal(defaultOriginal);
            setPrintCopy(defaultCopy);
        }
    }, [open, defaultOriginal, defaultCopy]);

    return (
        <Dialog
            open={open}
            onClose={onClose}
            maxWidth="xs"
            fullWidth
        >
            <DialogTitle>
                {title}
            </DialogTitle>

            <DialogContent>
                <Grid container spacing={1}>
                    <GridTextField item xs={6} sm={6}>
                        <FormGroup row>
                            <FormControlLabel
                                control={
                                    <Checkbox
                                        checked={printOriginal}
                                        onChange={(e) => setPrintOriginal(e.target.checked)}
                                    />
                                }
                                label={t('billingManagement.original')}
                            />

                            <FormControlLabel
                                control={
                                    <Checkbox
                                        checked={printCopy}
                                        onChange={(e) => setPrintCopy(e.target.checked)}
                                    />
                                }
                                label={t('billingManagement.copy')}
                            />
                        </FormGroup>
                    </GridTextField>
                    <GridTextField item xs={6} sm={6} />
                    {children ? (
                        children
                    ) : (<></>
                    )}
                </Grid>


            </DialogContent>

            <DialogActions>
                <Button
                    variant="contained"
                    onClick={onClose}
                    className="btn-cool-grey">
                    {t('button.close')}
                </Button>

                <Button
                    variant="contained"
                    disabled={!printOriginal && !printCopy}
                    className="btn-emerald-green"
                    onClick={() =>
                        onConfirm({
                            original: printOriginal,
                            copy: printCopy
                        })
                    }
                >
                    {t('button.confirm')}
                </Button>
            </DialogActions>
        </Dialog>
    );
};

export default ViewOptionDialog;
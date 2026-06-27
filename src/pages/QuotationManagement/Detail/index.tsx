/* eslint-disable prettier/prettier */
import { ArrowBackIos, ArrowDropDown, Description, Menu as MenuIcon, Save } from '@mui/icons-material';
import {
    Box,
    Button,
    Chip,
    Grid,
    ListItemIcon,
    ListItemText,
    Menu,
    MenuItem,
    Stack,
    Table,
    TableBody,
    TableCell,
    TableContainer,
    TableHead,
    TableRow,
    Tab,
    Tabs,
    TextField,
    Typography,
    useMediaQuery,
    useTheme
} from '@mui/material';
import { makeStyles } from '@mui/styles';
import Can from 'auth/Can';
import { PERMISSIONS } from 'auth/permissions';
import ActivityHistoryTimeline from 'components/ActivityHistoryTimeline';
import ConfirmDialog from 'components/ConfirmDialog';
import LoadingDialog from 'components/LoadingDialog';
import PageTitle from 'components/PageTitle';
import { GridSearchSection, Wrapper } from 'components/Styled';
import { Page } from 'layout/LayoutRoute';
import { MouseEvent as ReactMouseEvent, ReactElement, SyntheticEvent, useEffect, useState } from 'react';
import toast from 'react-hot-toast';
import { useTranslation } from 'react-i18next';
import { IoPencil } from 'react-icons/io5';
import { useQuery } from 'react-query';
import { useHistory, useParams } from 'react-router-dom';
import { ROUTE_PATHS } from 'routes';
import { getActivityHistory } from 'services/ActivityHistory/activity-history-api';
import { getQuotation, updateQuotation, viewQuotation } from 'services/Document/document-api';
import { Quotation, QuotationItem } from 'services/Document/document-type';
import { DownloadDocumentResponse } from 'services/general-type';
import { base64ToBlob } from 'utils';
import { formatNumber } from 'utils/utils';

const getEmployeeName = (quotation?: Quotation) => {
    const employee = quotation?.saleAccount || quotation?.salesAccount;
    if (!employee) {
        return '-';
    }

    return [employee.firstNameTh, employee.lastNameTh].filter(Boolean).join(' ').trim() || '-';
};

function TabPanel({
    value,
    currentTab,
    children
}: {
    value: string;
    currentTab: string;
    children: ReactElement;
}): ReactElement | null {
    if (value !== currentTab) {
        return null;
    }

    return (
        <Box role="tabpanel" sx={{ pt: 3 }}>
            {children}
        </Box>
    );
}

export default function QuotationDetail(): JSX.Element {
    const { id: quotationNo = '' } = useParams<{ id: string }>();
    const useStyles = makeStyles({
        tableHeader: {
            border: '2px solid #e0e0e0',
            fontWeight: 'bold',
            paddingLeft: '10px',
            textAlign: 'center'
        },
        section: {
            backgroundColor: '#fff',
            border: '1px solid #e6ebf1',
            borderRadius: 12,
            padding: 16,
            boxShadow: '0 12px 30px rgba(15, 23, 42, 0.05)'
        },
        label: {
            color: '#64748b',
            fontSize: 12,
            fontWeight: 700
        },
        productImage: {
            width: 64,
            height: 64,
            objectFit: 'cover',
            borderRadius: 8,
            border: '1px solid #e6ebf1',
            backgroundColor: '#f8fafc'
        },
        specCell: {
            width: 260,
            maxWidth: 260,
            whiteSpace: 'normal',
            wordBreak: 'break-word'
        },
        fitContentCell: {
            width: 1,
            whiteSpace: 'nowrap'
        },
        itemTextField: {
            '& .MuiInputBase-input': {
                fontSize: 13,
                padding: '8px 10px'
            }
        }
    });

    const classes = useStyles();
    const { t } = useTranslation();
    const history = useHistory();
    const theme = useTheme();
    const isDownSm = useMediaQuery(theme.breakpoints.down('sm'));
    const [tab, setTab] = useState<'detail' | 'history'>('detail');
    const [isEditing, setIsEditing] = useState(false);
    const [isUpdating, setIsUpdating] = useState(false);
    const [confirmUpdateOpen, setConfirmUpdateOpen] = useState(false);
    const [draftRemark, setDraftRemark] = useState('');
    const [draftItems, setDraftItems] = useState<QuotationItem[]>([]);
    const [actionMenuAnchorEl, setActionMenuAnchorEl] = useState<null | HTMLElement>(null);

    const { data: quotationResponse, isFetching, refetch: refetchQuotation } = useQuery(
        ['quotation-detail', quotationNo],
        () => getQuotation(quotationNo),
        {
            enabled: !!quotationNo,
            refetchOnWindowFocus: false
        }
    );

    const { data: activityHistory = [], isFetching: isActivityHistoryFetching, refetch: refetchActivityHistory } = useQuery(
        ['quotation-activity-history', quotationNo],
        () => getActivityHistory('QUOTATION', quotationNo),
        {
            enabled: !!quotationNo,
            refetchOnWindowFocus: false
        }
    );

    const quotation = quotationResponse?.data;
    const displayItems = isEditing ? draftItems : quotation?.items || [];
    const isActionMenuOpen = Boolean(actionMenuAnchorEl);

    useEffect(() => {
        if (!quotation) {
            return;
        }

        setDraftRemark(quotation.remark || '');
        setDraftItems(quotation.items || []);
        setIsEditing(false);
    }, [quotation]);

    const handleEditQuotation = () => {
        if (!quotation) {
            return;
        }

        setDraftRemark(quotation.remark || '');
        setDraftItems(quotation.items || []);
        setIsEditing(true);
    };

    const handleCancelEditQuotation = () => {
        setDraftRemark(quotation?.remark || '');
        setDraftItems(quotation?.items || []);
        setIsEditing(false);
        setConfirmUpdateOpen(false);
    };

    const handleOpenActionMenu = (event: ReactMouseEvent<HTMLElement>) => {
        setActionMenuAnchorEl(event.currentTarget);
    };

    const handleCloseActionMenu = () => {
        setActionMenuAnchorEl(null);
    };

    const updateDraftItem = (index: number, field: keyof QuotationItem, value: string) => {
        setDraftItems((prev) =>
            prev.map((item, itemIndex) => {
                if (itemIndex !== index) {
                    return item;
                }

                if (field === 'unitPrice' || field === 'quantity') {
                    const nextValue = Number(value) || 0;
                    const nextItem = {
                        ...item,
                        [field]: nextValue
                    };

                    return {
                        ...nextItem,
                        amount: (nextItem.unitPrice || 0) * (nextItem.quantity || 0)
                    };
                }

                return {
                    ...item,
                    [field]: value
                };
            })
        );
    };

    const viewQuotationFunction = () => {
        handleCloseActionMenu();

        if (!quotation?.quotationNo) {
            return;
        }

        toast.promise(viewQuotation(quotation.quotationNo, true, false), {
            loading: t('toast.loading'),
            success: (response) => {
                const data = response.data as DownloadDocumentResponse;

                if (!data.files?.length) {
                    throw new Error('No file');
                }

                const file = data.files[0];
                const blob = base64ToBlob(file.base64, file.contentType);
                const url = URL.createObjectURL(blob);

                window.open(url, '_blank', 'noopener,noreferrer');

                return t('toast.success');
            },
            error: () => t('toast.failed')
        });
    };

    const handleSelectEditQuotation = () => {
        handleCloseActionMenu();
        handleEditQuotation();
    };

    const handleSaveQuotation = async () => {
        if (!quotationNo) {
            return;
        }

        setConfirmUpdateOpen(false);
        setIsUpdating(true);

        try {
            await toast.promise(
                updateQuotation(quotationNo, {
                    remark: draftRemark,
                    items: draftItems
                }),
                {
                    loading: t('toast.loading'),
                    success: t('toast.success'),
                    error: t('toast.failed')
                }
            );
            setIsEditing(false);
            await Promise.all([refetchQuotation(), refetchActivityHistory()]);
        } catch {
            // Toast already shows the failed state.
        } finally {
            setIsUpdating(false);
        }
    };

    const handleChangeTab = (_event: SyntheticEvent, value: 'detail' | 'history') => {
        setTab(value);
    };

    return (
        <Page>
            <LoadingDialog open={isFetching || isActivityHistoryFetching || isUpdating} />
            <PageTitle title={'ใบเสนอราคาเลขที่ ' + quotation?.quotationNo || t('documentManagement.quotation.title')}>
                {quotation?.status ? <Chip label={quotation.status} size="small" /> : null}
            </PageTitle>
            <Wrapper>
                <Stack
                    direction={{ xs: 'column', sm: 'row' }}
                    spacing={1}
                    useFlexGap
                    sx={{ justifyContent: { sm: 'flex-end' }, alignItems: { xs: 'stretch', sm: 'center' }, mb: 2 }}>
                    {isEditing ? (
                        <>
                            <Button
                                fullWidth={isDownSm}
                                variant="contained"
                                className="btn-emerald-green"
                                startIcon={<Save />}
                                onClick={() => setConfirmUpdateOpen(true)}
                                disabled={isUpdating}>
                                {t('button.save')}
                            </Button>
                            <Button
                                fullWidth={isDownSm}
                                variant="contained"
                                className="btn-cool-grey"
                                onClick={handleCancelEditQuotation}
                                disabled={isUpdating}>
                                {t('button.cancel')}
                            </Button>
                        </>
                    ) : (
                        <>
                            <Button
                                fullWidth={isDownSm}
                                variant="contained"
                                className="btn-indigo-blue"
                                startIcon={<MenuIcon />}
                                endIcon={<ArrowDropDown />}
                                onClick={handleOpenActionMenu}
                                disabled={!quotation}
                                aria-controls={isActionMenuOpen ? 'quotation-action-menu' : undefined}
                                aria-haspopup="true"
                                aria-expanded={isActionMenuOpen ? 'true' : undefined}>
                                ตัวเลือก
                            </Button>
                            <Menu
                                id="quotation-action-menu"
                                anchorEl={actionMenuAnchorEl}
                                open={isActionMenuOpen}
                                onClose={handleCloseActionMenu}
                                anchorOrigin={{ vertical: 'bottom', horizontal: 'left' }}
                                transformOrigin={{ vertical: 'top', horizontal: 'left' }}
                                PaperProps={{
                                    sx: {
                                        minWidth: actionMenuAnchorEl?.offsetWidth || undefined
                                    }
                                }}
                                keepMounted>
                                <MenuItem
                                    onClick={viewQuotationFunction}
                                    disabled={!quotation || quotation.status === 'CANCELLED'}
                                    sx={{ width: '100%' }}>
                                    <ListItemIcon>
                                        <Description fontSize="small" />
                                    </ListItemIcon>
                                    <ListItemText primary={t('documentManagement.quotation.viewQuotation')} />
                                </MenuItem>
                                <Can permission={PERMISSIONS.QUOTATION_EDIT}>
                                    <MenuItem
                                        onClick={handleSelectEditQuotation}
                                        disabled={!quotation || quotation.status === 'CANCELLED'}
                                        sx={{ width: '100%' }}>
                                        <ListItemIcon>
                                            <IoPencil />
                                        </ListItemIcon>
                                        <ListItemText primary={t('documentManagement.quotation.editQuotation')} />
                                    </MenuItem>
                                </Can>
                            </Menu>
                        </>
                    )}
                    <Button
                        fullWidth={isDownSm}
                        variant="contained"
                        className="btn-cool-grey"
                        startIcon={<ArrowBackIos />}
                        onClick={() => history.push(ROUTE_PATHS.QUOTATION_MANAGEMENT)}>
                        {t('button.back')}
                    </Button>
                </Stack>

                <Box
                    sx={{
                        backgroundColor: '#fff',
                        border: '1px solid #e6ebf1',
                        borderRadius: 3,
                        overflow: 'hidden',
                        boxShadow: '0 12px 30px rgba(15, 23, 42, 0.05)'
                    }}>
                    <Tabs
                        value={tab}
                        onChange={handleChangeTab}
                        sx={{
                            px: 2,
                            '& .MuiTab-root': {
                                minHeight: 56,
                                textTransform: 'none',
                                fontWeight: 600
                            }
                        }}>
                        <Tab value="detail" label={t('documentManagement.quotation.detail')} />
                        <Tab value="history" label="ประวัติ" />
                    </Tabs>
                </Box>

                <TabPanel value="detail" currentTab={tab}>
                    <>
                        <Grid container spacing={2}>
                            <Grid item xs={12} md={4}>
                                <Stack spacing={1.25} className={classes.section}>
                                    <Typography variant="h6">{t('documentManagement.quotation.title')}</Typography>
                                    <Info label={t('documentManagement.quotation.docNo')} value={quotation?.quotationNo} />
                                    <Info label={t('documentManagement.quotation.docDate')} value={quotation?.docDate} />
                                    <Info label={t('documentManagement.quotation.expectiveDate')} value={quotation?.effectiveDate} />
                                    <Info label={t('documentManagement.quotation.status')} value={quotation?.status} />
                                    <Info label={"Revision : "} value={quotation?.revNo ?? '-'} />
                                </Stack>
                            </Grid>
                            <Grid item xs={12} md={4}>
                                <Stack spacing={1.25} className={classes.section}>
                                    <Typography variant="h6">{t('customerManagement.customer')}</Typography>
                                    <Info
                                        label={t('customerManagement.customer')}
                                        value={quotation?.customer ? `(${quotation.customer.id}) ${quotation.customer.customerName}` : '-'}
                                    />
                                    <Info label={t('documentManagement.quotation.customerSection.contactName')} value={quotation?.customerContact?.contactName} />
                                    <Info label={t('documentManagement.quotation.customerSection.contactNumber')} value={quotation?.customerContact?.contactNumber} />
                                </Stack>
                            </Grid>
                            <Grid item xs={12} md={4}>
                                <Stack spacing={1.25} className={classes.section}>
                                    <Typography variant="h6">{t('documentManagement.quotation.salesAccount')}</Typography>
                                    <Info label={t('documentManagement.quotation.salesAccount')} value={getEmployeeName(quotation)} />
                                    <Info label={t('documentManagement.quotation.coSalesAccount')} value={quotation?.coSaleId || quotation?.coSalesId} />
                                </Stack>
                            </Grid>
                            <Grid item xs={12}>
                                <Stack spacing={1.25} className={classes.section}>
                                    <Typography variant="h6">{t('documentManagement.quotation.remark')}</Typography>
                                    {isEditing ? (
                                        <TextField
                                            multiline
                                            minRows={3}
                                            fullWidth
                                            value={draftRemark}
                                            onChange={(event) => setDraftRemark(event.target.value)}
                                        />
                                    ) : (
                                        <Typography variant="body2" sx={{ whiteSpace: 'pre-wrap', wordBreak: 'break-word' }}>
                                            {quotation?.remark || '-'}
                                        </Typography>
                                    )}
                                </Stack>
                            </Grid>
                        </Grid>

                        <GridSearchSection container>
                            <TableContainer>
                                <Table id="quotation_detail___table">
                                    <TableHead>
                                        <TableRow>
                                            <TableCell align="center" className={`${classes.tableHeader} ${classes.fitContentCell}`}>#</TableCell>
                                            <TableCell align="center" className={`${classes.tableHeader} ${classes.fitContentCell}`}>
                                                {t('documentManagement.quotation.itemSection.image')}
                                            </TableCell>
                                            <TableCell className={`${classes.tableHeader} ${classes.fitContentCell}`}>{t('documentManagement.quotation.itemSection.name')}</TableCell>
                                            <TableCell className={`${classes.tableHeader} ${classes.specCell}`}>{t('documentManagement.quotation.itemSection.spec')}</TableCell>
                                            <TableCell align="right" className={`${classes.tableHeader} ${classes.fitContentCell}`}>{t('documentManagement.quotation.itemSection.unitPrice')}</TableCell>
                                            <TableCell align="right" className={`${classes.tableHeader} ${classes.fitContentCell}`}>{t('documentManagement.quotation.itemSection.quantity')}</TableCell>
                                            <TableCell align="right" className={`${classes.tableHeader} ${classes.fitContentCell}`}>{t('documentManagement.quotation.itemSection.totalAmount')}</TableCell>
                                        </TableRow>
                                    </TableHead>
                                    <TableBody>
                                        {displayItems.length ? (
                                            displayItems.map((item, index) => (
                                                <TableRow key={item.id || index}>
                                                    <TableCell align="center" className={classes.fitContentCell}>{index + 1}</TableCell>
                                                    <TableCell align="center" className={classes.fitContentCell}>
                                                        {item.imagePreview || item.imageUrl ? (
                                                            <Box
                                                                component="img"
                                                                src={item.imagePreview || item.imageUrl}
                                                                alt={item.name || t('documentManagement.quotation.itemSection.name')}
                                                                className={classes.productImage}
                                                            />
                                                        ) : (
                                                            <Typography variant="caption" color="text.secondary">
                                                                {t('documentManagement.quotation.itemSection.noImage')}
                                                            </Typography>
                                                        )}
                                                    </TableCell>
                                                    <TableCell className={classes.fitContentCell}>
                                                        {isEditing ? (
                                                            <TextField
                                                                className={classes.itemTextField}
                                                                value={item.name || ''}
                                                                onChange={(event) => updateDraftItem(index, 'name', event.target.value)}
                                                            />
                                                        ) : (
                                                            item.name || '-'
                                                        )}
                                                    </TableCell>
                                                    <TableCell className={classes.specCell}>
                                                        {isEditing ? (
                                                            <TextField
                                                                className={classes.itemTextField}
                                                                value={item.spec || ''}
                                                                fullWidth
                                                                multiline
                                                                minRows={2}
                                                                onChange={(event) => updateDraftItem(index, 'spec', event.target.value)}
                                                            />
                                                        ) : (
                                                            item.spec || '-'
                                                        )}
                                                    </TableCell>
                                                    <TableCell align="right" className={classes.fitContentCell}>
                                                        {isEditing ? (
                                                            <TextField
                                                                className={classes.itemTextField}
                                                                type="number"
                                                                value={item.unitPrice || 0}
                                                                onChange={(event) => updateDraftItem(index, 'unitPrice', event.target.value)}
                                                            />
                                                        ) : (
                                                            formatNumber(item.unitPrice || 0)
                                                        )}
                                                    </TableCell>
                                                    <TableCell align="right" className={classes.fitContentCell}>
                                                        {isEditing ? (
                                                            <TextField
                                                                className={classes.itemTextField}
                                                                type="number"
                                                                value={item.quantity || 0}
                                                                onChange={(event) => updateDraftItem(index, 'quantity', event.target.value)}
                                                            />
                                                        ) : (
                                                            formatNumber(item.quantity || 0)
                                                        )}
                                                    </TableCell>
                                                    <TableCell align="right" className={classes.fitContentCell}>{formatNumber(item.amount || 0)}</TableCell>
                                                </TableRow>
                                            ))
                                        ) : (
                                            <TableRow>
                                                <TableCell colSpan={7} align="center">
                                                    {t('warning.noResultList')}
                                                </TableCell>
                                            </TableRow>
                                        )}
                                    </TableBody>
                                </Table>
                            </TableContainer>
                        </GridSearchSection>

                        {quotation?.isShowSummary ? (
                            <GridSearchSection container spacing={2} justifyContent="flex-end">
                                <Grid item xs={12} md={4}>
                                    <Stack spacing={1.25} className={classes.section}>
                                        <Summary label={t('documentManagement.quotation.summarySection.subtotal')} value={quotation?.subTotal} />
                                        <Summary label={t('documentManagement.quotation.summarySection.discount')} value={quotation?.discount} />
                                        <Summary label={t('documentManagement.quotation.summarySection.vat')} value={quotation?.vat} />
                                        <Summary label={t('documentManagement.quotation.summarySection.grandTotal')} value={quotation?.grandTotal} strong />
                                    </Stack>
                                </Grid>
                            </GridSearchSection>
                        ) : null}

                    </>
                </TabPanel>

                <TabPanel value="history" currentTab={tab}>
                    <Wrapper>
                        <ActivityHistoryTimeline records={activityHistory} />
                    </Wrapper>
                </TabPanel>
            </Wrapper>

            <ConfirmDialog
                open={confirmUpdateOpen}
                title={t('documentManagement.quotation.confirmUpdateTitle')}
                message={t('documentManagement.quotation.confirmUpdateMsg')}
                confirmText={t('button.confirm')}
                cancelText={t('button.cancel')}
                isShowCancelButton={true}
                isShowConfirmButton={true}
                onConfirm={() => {
                    void handleSaveQuotation();
                }}
                onCancel={() => setConfirmUpdateOpen(false)}
            />
        </Page>
    );
}

function Info({ label, value }: { label: string; value?: string | null }) {
    return (
        <Stack spacing={0.25}>
            <Typography variant="caption" color="text.secondary" fontWeight={700}>
                {label}
            </Typography>
            <Typography variant="body2">{value || '-'}</Typography>
        </Stack>
    );
}

function Summary({ label, value, strong = false }: { label: string; value?: number | null; strong?: boolean }) {
    return (
        <Stack direction="row" justifyContent="space-between" spacing={1}>
            <Typography variant="body2" fontWeight={strong ? 700 : 400}>
                {label}
            </Typography>
            <Typography variant="body2" fontWeight={strong ? 700 : 400}>
                {formatNumber(value || 0)}
            </Typography>
        </Stack>
    );
}

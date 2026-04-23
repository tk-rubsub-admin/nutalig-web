/* eslint-disable prettier/prettier */
import { AddCircle, Download, Visibility } from '@mui/icons-material';
import {
    Grid,
    Button,
    TextField,
    Table,
    TableCell,
    TableContainer,
    TableHead,
    TableRow,
    Stack,
    Autocomplete,
    useTheme,
    useMediaQuery,
    CircularProgress,
    TableBody,
    IconButton,
    Tooltip,
    Chip
} from '@mui/material';
import { makeStyles } from '@mui/styles';
import LoadingDialog from 'components/LoadingDialog';
import PageTitle from 'components/PageTitle';
import { GridSearchSection, Wrapper } from 'components/Styled';
import { Page } from 'layout/LayoutRoute';
import { useMemo, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { useQuery } from 'react-query';
import { generatePath, Link, useHistory } from 'react-router-dom';
import { ROUTE_PATHS } from 'routes';
import { getSystemConfig } from 'services/Config/config-api';
import { SystemConfig } from 'services/Config/config-type';
import { generatePriceListImage, getAllPriceList } from 'services/Product/product-api';
import { PriceListHeader } from 'services/Product/product-type';
import { DEFAULT_DATETIME_FORMAT_2, formaDateStringWithPattern } from 'utils';

export default function PriceList() {
    const { t } = useTranslation();
    const theme = useTheme();
    const isDownSm = useMediaQuery(theme.breakpoints.down('sm'));
    const history = useHistory();
    const useStyles = makeStyles({
        hideObject: {
            display: 'none'
        },
        noResultMessage: {
            textAlign: 'center',
            fontSize: '1.2em',
            fontWeight: 'bold',
        },
        tableHeader: {
            border: '2px solid #e0e0e0',
            fontWeight: 'bold',
            paddingLeft: '10px',
            textAlign: 'center'
        },
        datePickerFromTo: {
            '&& .MuiOutlinedInput-input': {
                padding: '16.5px 14px'
            },
            '&& .MuiFormLabel-root': {
                fontSize: '13px'
            }
        },
        bkkChip: {
            backgroundColor: '#068710',
            color: 'white'
        },
        provinceChip: {
            backgroundColor: '#a533ff',
            color: 'white'
        },
        fileInput: {
            width: '100%',
            padding: '11px',
            border: '1px solid #ccc',
            borderRadius: '4px',
            fontSize: '14px',
            '::file-selector-button': {
                color: 'red'
            }
        }
    });
    const classes = useStyles();
    const [isLoading, setIsLoading] = useState(false);
    const [typeFilter, setTypeFilter] = useState<SystemConfig | null>(null);
    const {
        data: priceList,
        isFetching: isListFetching
    } = useQuery(
        ['price-lists'],
        () => getAllPriceList(),
        {
            refetchOnWindowFocus: false,
            keepPreviousData: true,
        }
    );
    const {
        data: typeList,
        isFetching,
    } = useQuery('price-list', () => getSystemConfig('PRICE_LIST'), {
        refetchOnWindowFocus: false
    });

    const filteredList = useMemo(() => {
        if (!priceList || !priceList.data) return [];
        return priceList.data.filter(pl => {
            if (!typeFilter) return true;
            return pl.type === typeFilter.nameTh
        })
    }, [priceList, typeFilter]);

    const lists =
        !isListFetching && filteredList.length > 0 ? (
            filteredList.map((pl: PriceListHeader) => (
                <TableRow hover key={pl.headerId}>
                    <TableCell>{pl.name} {pl.status === 'ACTIVE' ?
                        <Chip color="success" size="small" label={t('general.statuses.active')} /> :
                        <Chip color="error" size="small" label={t('general.statuses.inactive')} />}
                    </TableCell>
                    <TableCell align='center'>{pl.type}</TableCell>
                    <TableCell align='center'>{formaDateStringWithPattern(pl.updatedDate, DEFAULT_DATETIME_FORMAT_2)} โดย {pl.updatedBy}</TableCell>
                    <TableCell align="center">
                        <Tooltip title={t('productManagement.priceList.tooltip.view')} arrow>
                            <Link
                                to={generatePath(ROUTE_PATHS.PRICE_LIST_VIEW, { id: pl.headerId })}
                            >
                                <IconButton size="small">
                                    <Visibility
                                        onClick={() => history.push(`/price-list/${pl.headerId}`)} />
                                </IconButton>
                            </Link>
                        </Tooltip>
                        <Tooltip title={t('productManagement.priceList.tooltip.download')} arrow>
                            <IconButton size="small" onClick={() => handleDownload(pl.headerId)}>
                                <Download />
                            </IconButton>
                        </Tooltip>
                    </TableCell>
                </TableRow>
            ))
        ) : (
            <TableRow>
                <TableCell colSpan={4}>
                    <div className={classes.noResultMessage}>{t('warning.noResultList')}</div>
                </TableCell>
            </TableRow>
        );

    const handleDownload = async (id: string) => {
        try {
            setIsLoading(true);

            // 1) เรียก API แล้ว "รอ" ให้เสร็จ
            const resp = await generatePriceListImage(id);
            console.log(JSON.stringify(resp));
            const imageUrls: string[] = resp?.data?.imageUrls ?? [];

            if (imageUrls.length === 0) {
                setIsLoading(false);
                alert('ไม่พบลิงก์ไฟล์ในระบบ');
                return;
            }

            // 2) โหลดพร้อมกันทั้งหมด (เร็วกว่า)
            await Promise.all(
                imageUrls.map(async (url, index) => {
                    const res = await fetch(url);
                    if (!res.ok) throw new Error(`Fetch failed: ${url}`);
                    const blob = await res.blob();

                    // ดึงชื่อไฟล์จาก URL (รองรับชื่อไทย + มี query string)
                    const beforeQuery = url.split('?')[0];
                    const rawName = beforeQuery.substring(beforeQuery.lastIndexOf('/') + 1);
                    const decoded = decodeURIComponent(rawName);
                    const fallback = `price_list_page-${index + 1}.jpg`;
                    const filename = decoded || fallback;

                    const a = document.createElement('a');
                    a.href = URL.createObjectURL(blob);
                    a.download = filename;
                    // บาง browser ต้องแทรกใน DOM ชั่วคราว
                    document.body.appendChild(a);
                    a.click();
                    document.body.removeChild(a);
                    URL.revokeObjectURL(a.href);
                })
            );
        } catch (error) {
            console.error('Download error:', error);
            alert('เกิดข้อผิดพลาดระหว่างดาวน์โหลด');
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <Page>
            <PageTitle title={t('productManagement.priceList.title')} />
            <Wrapper>
                <Stack
                    direction={{ xs: 'column', sm: 'row' }}
                    spacing={1}
                    useFlexGap
                    sx={{
                        mt: 1,
                        justifyContent: { sm: 'flex-end' }, // right-align when in row
                        alignItems: { xs: 'flex-end', sm: 'center' }, // right-align when stacked
                    }}
                >
                    <Button
                        fullWidth={isDownSm}
                        variant="contained"
                        className="btn-emerald-green"
                        onClick={() => history.push(ROUTE_PATHS.PRICE_LIST_CREATE)}
                        startIcon={<AddCircle />}>
                        {t('staffManagement.action.create')}
                    </Button>
                </Stack>
            </Wrapper>
            <Wrapper>
                <GridSearchSection container spacing={1}>
                    <Grid item xs={12} sm={2} style={{ paddingTop: '30px' }}>
                        <Autocomplete
                            disabled={isFetching}
                            options={typeList ?? []}
                            getOptionLabel={(option: SystemConfig) => option?.nameTh ?? ''}
                            value={typeFilter}
                            isOptionEqualToValue={(opt, val) => opt.code === val.code}
                            onChange={(_e, value, reason) => {
                                if (reason === 'clear') setTypeFilter(null);
                                else setTypeFilter(value);
                            }}
                            renderInput={(params) => (
                                <TextField
                                    {...params}
                                    label={t('productManagement.productList.column.category')}
                                    InputLabelProps={{ shrink: true }}
                                />
                            )}
                        />
                    </Grid>
                </GridSearchSection>
                <GridSearchSection container spacing={1}>
                    <TableContainer>
                        <Table id="product_list___table">
                            <TableHead>
                                <TableRow>
                                    <TableCell align="center" key="productName" className={classes.tableHeader}>
                                        {t('productManagement.priceList.column.name')}
                                    </TableCell>
                                    <TableCell align="center" key="type" className={classes.tableHeader}>
                                        {t('productManagement.priceList.column.type')}
                                    </TableCell>
                                    <TableCell align="center" key="lastedUpdate" className={classes.tableHeader}>
                                        {t('productManagement.priceList.column.updatedDate')}
                                    </TableCell>
                                    <TableCell align="center" key="action" className={classes.tableHeader}>
                                        {t('productManagement.priceList.column.action')}
                                    </TableCell>
                                </TableRow>
                            </TableHead>
                            <TableBody>
                                {isListFetching ? (
                                    <TableRow>
                                        <TableCell colSpan={4} align="center">
                                            <CircularProgress />
                                        </TableCell>
                                    </TableRow>
                                ) : (
                                    lists
                                )}
                            </TableBody>
                        </Table>
                    </TableContainer>
                </GridSearchSection>
            </Wrapper>
            <LoadingDialog
                open={isLoading}
            />
        </Page>
    )
}
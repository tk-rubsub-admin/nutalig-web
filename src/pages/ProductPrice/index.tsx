/* eslint-disable prettier/prettier */
import { CloudUpload, DownloadForOffline, Sell, Storefront } from '@mui/icons-material';
import { Button, Grid, Stack, Table, TableBody, TableCell, Tabs, Tab, Box, Badge, TableContainer, TableHead, TableRow, Tooltip, Typography, useMediaQuery, useTheme, CircularProgress, Paper, Chip } from '@mui/material';
import { makeStyles } from '@mui/styles';
import LoadingDialog from 'components/LoadingDialog';
import PageTitle from 'components/PageTitle';
import { GridSearchSection, Wrapper } from 'components/Styled';
import dayjs from 'dayjs';
import { Page } from 'layout/LayoutRoute';
import { useEffect, useMemo, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { useQuery } from 'react-query';
import { useHistory } from 'react-router-dom';
import { exportProductPrice, getProductPriceByDate } from 'services/Product/product-api';
import { DEFAULT_DATE_FORMAT_BFF, formaDateStringWithPattern, formatMoney } from 'utils';
import UploadProductPriceDialog from './UploadProductPriceDialog';
import toast from 'react-hot-toast';
import Paginate from 'components/Paginate';
import ProgressDialog from 'components/ProgressDialog';

export default function ProductPriceList() {
    const { t } = useTranslation();
    const theme = useTheme();
    const isDownSm = useMediaQuery(theme.breakpoints.down('sm'));
    const history = useHistory();
    const [bkkPage, setBkkPage] = useState<number>(1);
    const [bkkPages, setBkkPages] = useState<number>(1);
    const [bkkPageSize, setBkkPageSize] = useState<number>(10);
    const [provincePage, setProvincePage] = useState<number>(1);
    const [provincePages, setProvincePages] = useState<number>(1);
    const [provincePageSize, setProvincePageSize] = useState<number>(10);
    const useStyles = makeStyles({
        hideObject: {
            display: 'none'
        },
        noResultMessage: {
            textAlign: 'center',
            fontSize: '1.2em',
            fontWeight: 'bold'
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
    const [openUploadDialog, setOpenUploadDialog] = useState(false);
    const [isOpenProgressDialog, setIsOpenProgressDialog] = useState(false)
    const [jobId, setJobId] = useState('')
    const [tab, setTab] = useState<'BKK' | 'PROVINCE'>('BKK');
    const handleTabChange = (_e: React.SyntheticEvent, v: 'BKK' | 'PROVINCE') => setTab(v);

    const handleExportProduct = async () => {
        toast.promise(exportProductPrice(), {
            loading: t('toast.loading'),
            success: (response) => {
                // Create a temporary URL for the Blob
                const url = window.URL.createObjectURL(new Blob([response.data]));

                let filename = 'อัพเดตราคา.xlsx'; // fallback

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
    }
    const todayKey = useMemo(
        () => dayjs().startOf('day').format(DEFAULT_DATE_FORMAT_BFF),
        []
    );

    const key = ['product-list', todayKey, tab,
        tab === 'BKK' ? bkkPage : provincePage,
        tab === 'BKK' ? bkkPageSize : provincePageSize];

    const { data: productPrices, isFetching, refetch: productRefetched } = useQuery(
        key,
        () => getProductPriceByDate(
            todayKey,
            tab === 'BKK' ? bkkPage : provincePage,
            tab === 'BKK' ? bkkPageSize : provincePageSize
        ),
        {
            keepPreviousData: false,           // << เคลียร์ข้อมูลเก่าระหว่างโหลด
            refetchOnWindowFocus: false,
            onSuccess: (data) => {
                if (tab === 'BKK' && data?.bkkPagination) {
                    setBkkPage(data.bkkPagination.page);
                    setBkkPageSize(data.bkkPagination.size);
                    setBkkPages(data.bkkPagination.totalPage);
                }
                if (tab === 'PROVINCE' && data?.provincePagination) {
                    setProvincePage(data.provincePagination.page);
                    setProvincePageSize(data.provincePagination.size);
                    setProvincePages(data.provincePagination.totalPage);
                }
            }
        }
    );

    const bkkList = productPrices?.bkkPrices ?? [];
    const provinceList = productPrices?.provincePrices ?? [];
    const currentList = tab === 'BKK' ? bkkList : provinceList;

    useEffect(() => {
        if (tab === 'BKK') setBkkPage(1);
        else setProvincePage(1);
    }, [tab, todayKey]);
    return (
        <Page>
            <PageTitle title={t('productManagement.productPrice.title')} />
            <LoadingDialog open={isFetching} />
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
                        className="btn-baby-blue"
                        onClick={() => setOpenUploadDialog(true)}
                        startIcon={<CloudUpload />}>
                        {t('button.importStocks')}
                    </Button>
                    <Button
                        fullWidth={isDownSm}
                        variant="contained"
                        className="btn-green-teal"
                        onClick={() => handleExportProduct()}
                        startIcon={<DownloadForOffline />}>
                        {t('button.export')}
                    </Button>
                </Stack>
            </Wrapper>
            <Wrapper>
                <GridSearchSection container spacing={1}>
                    <Grid item xs={12} sm={6}>
                        <Typography variant="h6" component="h2">
                            {t('productManagement.productPrice.list')} {productPrices?.date}
                        </Typography>
                    </Grid>
                    <Grid item xs={12} sm={6} sx={{ textAlign: 'right' }}
                    >
                        <Typography variant="caption">
                            {t('purchaseOrder.purchaseSection.updatedDate', { date: formaDateStringWithPattern(productPrices?.lastUpdatedDate, 'DD/MM/YYYY HH:mm') })}
                        </Typography>
                    </Grid>

                    <Grid item xs={12}>
                        <Box sx={{ borderBottom: 1, borderColor: 'divider' }}>
                            <Tabs
                                value={tab}
                                onChange={handleTabChange}
                                variant={isDownSm ? 'fullWidth' : 'standard'}
                                aria-label="area tabs"
                            >
                                <Tab
                                    value="BKK"
                                    label="กรุงเทพและปริมณฑล"
                                />
                                <Tab
                                    value="PROVINCE"
                                    label="ต่างจังหวัด"
                                />
                            </Tabs>
                        </Box>
                    </Grid>

                    <GridSearchSection container spacing={1}>
                        <TableContainer
                            component={Paper}
                            elevation={0}
                            sx={{
                                borderRadius: 2,
                                border: '1px solid',
                                borderColor: 'divider',
                                overflow: 'hidden',                // ให้ขอบมนทำงาน
                            }}
                        >
                            <Table
                                stickyHeader
                                size="small"                        // ตารางดูแน่นขึ้น
                                sx={{
                                    tableLayout: 'fixed',             // คุมความกว้างคอลัมน์
                                    '& thead th': {
                                        background:
                                            'linear-gradient(180deg, rgba(250,250,250,1) 0%, rgba(245,245,245,1) 100%)',
                                        color: 'text.primary',
                                        fontWeight: 700,
                                        borderBottom: '1px solid',
                                        borderColor: 'divider',
                                        py: 1.25,
                                    },
                                    '& tbody td': {
                                        borderBottom: '1px solid',
                                        borderColor: 'divider',
                                        py: 1,                           // ความสูงแถว
                                    },
                                    // zebra striping
                                    '& tbody tr:nth-of-type(odd)': {
                                        backgroundColor: 'rgba(0,0,0,0.015)',
                                    },
                                    // hover
                                    '& tbody tr:hover': {
                                        backgroundColor: 'action.hover',
                                    },
                                }}
                            >
                                <TableHead>
                                    <TableRow>
                                        <TableCell
                                            align="center"
                                            colSpan={3}
                                            rowSpan={2}
                                            sx={{ width: { xs: '45%', md: '28%' } }}             // ชื่อสินค้า
                                        >
                                            {t('productManagement.productPrice.column.name')}
                                        </TableCell>
                                        <TableCell
                                            align="center"
                                            rowSpan={2}
                                            sx={{ width: { xs: '10%', md: '14%' }, whiteSpace: 'nowrap' }}
                                        >
                                            {t('productManagement.productPrice.column.type')}
                                        </TableCell>
                                        <TableCell align="center" rowSpan={2} sx={{ width: '8%', whiteSpace: 'nowrap' }}>
                                            {t('productManagement.productPrice.column.costOfGoodsSold')}
                                        </TableCell>
                                        <TableCell align="center" rowSpan={2} sx={{ width: '8%', whiteSpace: 'nowrap' }}>
                                            {t('productManagement.productPrice.column.retail')}
                                        </TableCell>
                                        <TableCell align="center" colSpan={7} sx={{ width: '50%', whiteSpace: 'nowrap' }}>
                                            {t('productManagement.productPrice.column.wholesale.title')}
                                        </TableCell>
                                    </TableRow>
                                    <TableRow>
                                        {Array.from({ length: 7 }).map((_, i) => (
                                            <TableCell key={i} align="center" sx={{ whiteSpace: 'nowrap' }}>
                                                {t(`productManagement.productPrice.column.wholesale.${i + 1}`)}
                                            </TableCell>
                                        ))}
                                    </TableRow>
                                </TableHead>

                                <TableBody>
                                    {isFetching ? (
                                        <TableRow>
                                            <TableCell colSpan={13} align="center">
                                                <CircularProgress size={22} />
                                            </TableCell>
                                        </TableRow>
                                    ) : (
                                        currentList?.length ? (
                                            currentList.map((p: any) => (
                                                <TableRow key={`${p.productSku}-${tab}`}>
                                                    {/* ชื่อสินค้า + SKU */}
                                                    <TableCell colSpan={2} sx={{ pr: 2 }}>
                                                        <Typography
                                                            variant="body2"
                                                            fontWeight={600}
                                                            noWrap
                                                            title={p.product?.productNameTh}
                                                        >
                                                            {p.product?.productNameTh ?? '-'}
                                                        </Typography>
                                                        <Typography
                                                            variant="caption"
                                                            color="text.secondary"
                                                            sx={{ display: 'block' }}
                                                            noWrap
                                                            title={p.product?.productSku}
                                                        >
                                                            {'SKU: ' + (p.product?.productSku ?? '-')}
                                                        </Typography>
                                                    </TableCell>

                                                    {/* ไอคอนสถานะ */}
                                                    <TableCell
                                                        sx={{
                                                            width: { xs: '10%', md: '8%' },
                                                            display: 'table-cell',
                                                        }}
                                                    >
                                                        <Stack direction="row" spacing={1.5} alignItems="center">
                                                            <Tooltip title={p.isSelfStock ? t('productManagement.productPrice.isSelfStock') : t('productManagement.productPrice.notSelfStock')}>
                                                                <Storefront sx={{ color: p.isSelfStock ? 'success.main' : 'text.secondary' }} />
                                                            </Tooltip>
                                                            <Tooltip title={t('productManagement.productPrice.column.isMainProduct')}>
                                                                <Sell sx={{ color: p.isMainProduct ? 'success.main' : 'text.secondary' }} />
                                                            </Tooltip>
                                                        </Stack>
                                                    </TableCell>

                                                    {/* ประเภท/Price list */}
                                                    <TableCell sx={{ width: '8%' }} title={p.priceList?.nameTh} noWrap>
                                                        <Chip
                                                            size="small"
                                                            variant="outlined"
                                                            label={p.priceList?.nameTh ?? '-'}
                                                            sx={{ maxWidth: '100%', '& .MuiChip-label': { px: 1, overflow: 'hidden', textOverflow: 'ellipsis' } }}
                                                        />
                                                    </TableCell>

                                                    {/* ตัวเลข จัดขวา + monospace + คอมแพค */}
                                                    {[
                                                        p.costOfGoodsSold,
                                                        p.retailPrice,
                                                        p.wholeSalePrice1,
                                                        p.wholeSalePrice2,
                                                        p.wholeSalePrice3,
                                                        p.wholeSalePrice4,
                                                        p.wholeSalePrice5,
                                                        p.wholeSalePrice6,
                                                        p.wholeSalePrice7,
                                                    ].map((val: number, idx: number) => (
                                                        <TableCell
                                                            key={idx}
                                                            align="center"
                                                            sx={{
                                                                fontFeatureSettings: '"tnum"',
                                                                fontVariantNumeric: 'tabular-nums',
                                                                fontSize: 13,
                                                                whiteSpace: 'nowrap',
                                                            }}
                                                        >
                                                            {formatMoney(val)}
                                                        </TableCell>
                                                    ))}
                                                </TableRow>
                                            ))
                                        ) : (
                                            <TableRow>
                                                <TableCell colSpan={13} align="center">
                                                    <Box py={3} color="text.secondary">{t('warning.noResultList')}</Box>
                                                </TableCell>
                                            </TableRow>
                                        )
                                    )}
                                </TableBody>
                            </Table>
                        </TableContainer>
                    </GridSearchSection>
                    <GridSearchSection container>
                        <Grid item xs={12} sm={12}>
                            <Paginate
                                pagination={productPrices?.bkkPagination}
                                page={bkkPage}
                                pageSize={bkkPageSize}
                                setPage={setBkkPage}
                                setPageSize={setBkkPageSize}
                                refetch={productRefetched}
                                totalRecords={productPrices?.bkkPagination.totalRecords}
                                isShow={true}
                            />
                        </Grid>
                    </GridSearchSection>
                </GridSearchSection>
            </Wrapper>
            <UploadProductPriceDialog
                open={openUploadDialog}
                onClose={(job) => {
                    setOpenUploadDialog(false);
                    setJobId(job);
                    if (job != '' && jobId != null && jobId !== undefined) {
                        setIsOpenProgressDialog(true);
                    }
                }}
            />
            <ProgressDialog
                open={isOpenProgressDialog}
                jobId={jobId}
                onConfirm={() => {
                    setJobId('')
                    setIsOpenProgressDialog(false)
                    productRefetched()
                }}
                onClose={() => setIsOpenProgressDialog(false)}
            />
        </Page>
    )
}

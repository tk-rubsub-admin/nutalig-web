/* eslint-disable prettier/prettier */
import { Search, DisabledByDefault, Add, DownloadForOffline, CloudUpload, AddCircle } from '@mui/icons-material';
import {
    Grid,
    Typography,
    Button,
    TextField,
    CircularProgress,
    Table,
    TableBody,
    TableCell,
    TableContainer,
    TableHead,
    TableRow,
    Stack,
    Chip,
    Autocomplete,
    useTheme,
    useMediaQuery
} from '@mui/material';
import { makeStyles } from '@mui/styles';
import PageTitle from 'components/PageTitle';
import Paginate from 'components/Paginate';
import { GridSearchSection, Wrapper } from 'components/Styled';
import { useFormik } from 'formik';
import { Page } from 'layout/LayoutRoute';
import { useState } from 'react';
import toast from 'react-hot-toast';
import { useTranslation } from 'react-i18next';
import { useQuery } from 'react-query';
import { useHistory } from 'react-router-dom';
import {
    exportProduct,
    getProductConfig,
    searchProduct,
    updateProductKeyword
} from 'services/Product/product-api';
import { ProductDto, SearchProductRequest } from 'services/Product/product-type';
import UploadProductDialog from './UploadProductDialog';
import { ROUTE_PATHS } from 'routes';
import ProgressDialog from 'components/ProgressDialog';

export default function ProductList() {
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
    const [page, setPage] = useState<number>(1);
    const [pages, setPages] = useState<number>(1);
    const [pageSize, setPageSize] = useState<number>(100);
    const [openUploadDialog, setOpenUploadDialog] = useState(false);
    const [isOpenProgressDialog, setIsOpenProgressDialog] = useState(false)
    const [jobId, setJobId] = useState('')
    const [productFilter, setProductFilter] = useState<SearchProductRequest>({
        nameContain: '',
        skuContain: '',
        categoryEqual: '',
        groupEqual: '',
        subGroupEqual: '',
        parentSkuEqual: '',
        isIncludeParentSku: false
    });
    const [addingMap, setAddingMap] = useState<Record<string, boolean>>({});
    const [newKeywordMap, setNewKeywordMap] = useState<Record<string, string>>({});

    const {
        data: productList,
        refetch: productRefetched,
        isFetching: isProductFetching
    } = useQuery(
        ['product-list', productFilter, page, pageSize],
        () => searchProduct(productFilter, page, pageSize),
        {
            refetchOnWindowFocus: false,
            keepPreviousData: true,
            onSuccess: (data) => {
                if (data?.data?.pagination) {
                    setPage(data.data.pagination.page);
                    setPageSize(data.data.pagination.size);
                    setPages(data.data.pagination.totalPage);
                }
            }
        }
    );
    const {
        data: categoryList,
        isFetching: isCategoryFetching
    } = useQuery('product-categories', () => getProductConfig('CATEGORY'), {
        refetchOnWindowFocus: false
    });
    const {
        data: groupList,
        isFetching: isGroupFetching
    } = useQuery('product-groups', () => getProductConfig('GROUP'), {
        refetchOnWindowFocus: false
    });
    const {
        data: subGroupList,
        isFetching: isSubgroupFetching
    } = useQuery('product-subgroups', () => getProductConfig('SUBGROUP'), {
        refetchOnWindowFocus: false
    });
    const searchFormik = useFormik({
        initialValues: {
            nameContain: '',
            skuContain: '',
            categoryEqual: '',
            groupEqual: '',
            subGroupEqual: '',
        },
        enableReinitialize: false,
        onSubmit: (value) => {
            const updateObj = {
                nameContain: value.nameContain,
                skuContain: value.skuContain,
                categoryEqual: value.categoryEqual,
                groupEqual: value.groupEqual,
                subGroupEqual: value.subGroupEqual
            };
            setProductFilter(updateObj);
            productRefetched();
        }
    });
    const handleAddKeyword = (product: ProductDto) => {
        const keyword = (newKeywordMap[product.productSku] || '').trim();
        if (!keyword) return;

        const newKeywords = [
            ...(product.keywords?.split(',').map(k => k.trim()).filter(k => k) || []),
            keyword
        ];

        // TODO: ส่ง newKeywords ไป backend หรือจัดการต่อ
        console.log(`Product ${product.productSku} new keywords:`, newKeywords);
        toast.promise(updateProductKeyword(product.productSku, newKeywords), {
            loading: t('toast.loading'),
            success: t('toast.success'),
            error: t('toast.failed'),
        }).finally(() => {
            // ปิด input และล้างค่า
            setAddingMap(prev => ({ ...prev, [product.productSku]: false }));
            setNewKeywordMap(prev => ({ ...prev, [product.productSku]: '' }));
            productRefetched();
        });
    };

    const handleDeleteKeyword = (product: ProductDto, keywordToDelete: string) => {
        const keywords = product.keywords?.split(',') || [];

        const updatedKeywords = keywords
            .map(k => k.trim())
            .filter(k => k && k !== keywordToDelete);

        // TODO: ส่ง newKeywords ไป backend หรือจัดการต่อ
        toast.promise(updateProductKeyword(product.productSku, updatedKeywords), {
            loading: t('toast.loading'),
            success: t('toast.success'),
            error: t('toast.failed'),
        }).finally(() => {
            productRefetched();
        });
    };

    const handleExportProduct = async () => {
        toast.promise(exportProduct(productFilter), {
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
    }

    const products = (!isProductFetching &&
        productList &&
        productList?.data.products.length > 0 &&
        productList?.data.products.map((product: ProductDto) => {
            const adding = addingMap[product.productSku] || false;
            const newKeyword = newKeywordMap[product.productSku] || '';

            return (
                <TableRow
                    hover
                    id={`product__index-${product.productSku}`}
                    key={product.productSku}
                >
                    <TableCell>
                        <Typography>{product.productNameTh}</Typography>
                        <Typography variant='caption' color="text.secondary" fontSize={'10px'}>
                            {'SKU:' + product.productSku}
                        </Typography>
                    </TableCell>
                    <TableCell>
                        {product.productCategory}
                    </TableCell>
                    <TableCell>
                        {product.productGroup}
                    </TableCell>
                    <TableCell>
                        {product.productSubgroup}
                    </TableCell>
                    <TableCell>
                        <Stack direction="row" spacing={1} flexWrap="wrap" rowGap={1}>
                            {product.keywords
                                ?.split(',')
                                .filter((k) => k !== '')
                                .map((keyword, index) => (
                                    <Chip
                                        key={index}
                                        label={keyword.trim()}
                                        size="small"
                                        color="primary"
                                        onDelete={() => handleDeleteKeyword(product, keyword.trim())}
                                    />
                                ))}

                            {adding ? (
                                <TextField
                                    size="small"
                                    autoFocus
                                    value={newKeyword}
                                    onChange={(e) => {
                                        console.log('onchange');
                                        setNewKeywordMap(prev => ({
                                            ...prev,
                                            [product.productSku]: e.target.value
                                        }))
                                    }
                                    }
                                    onBlur={() => {
                                        setAddingMap(prev => ({
                                            ...prev,
                                            [product.productSku]: false
                                        }))
                                    }
                                    }
                                    onKeyDown={(e) => {
                                        if (e.key === 'Enter') {
                                            handleAddKeyword(product);
                                        } else if (e.key === 'Escape') {
                                            setAddingMap(prev => ({ ...prev, [product.productSku]: false }));
                                        }
                                    }}
                                    sx={{ width: 120 }}
                                />
                            ) : (
                                <Chip
                                    icon={<Add style={{ color: '#ffffff' }} />}
                                    size="small"
                                    label={t('productManagement.productList.addKeyword')}
                                    className="btn-emerald-green"
                                    onClick={() =>
                                        setAddingMap(prev => ({ ...prev, [product.productSku]: true }))
                                    }
                                    style={{ margin: '0 0 0 10px', cursor: 'pointer' }}
                                />
                            )}
                        </Stack>
                    </TableCell>
                </TableRow>
            )
        })) || (
            <TableRow>
                <TableCell colSpan={5}>
                    <div className={classes.noResultMessage}>{t('warning.noResultList')}</div>
                </TableCell>
            </TableRow>
        );

    return (
        <Page>
            <PageTitle title={t('productManagement.productList.title')} />
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
                        onClick={() => history.push(ROUTE_PATHS.NEW_PRODUCT)}
                        startIcon={<AddCircle />}>
                        {t('staffManagement.action.create')}
                    </Button>
                    <Button
                        fullWidth={isDownSm}
                        variant="contained"
                        className="btn-indigo-blue"
                        onClick={() => searchFormik.handleSubmit()}
                        startIcon={<Search />}>
                        {t('button.search')}
                    </Button>
                    <Button
                        fullWidth={isDownSm}
                        variant="contained"
                        className="btn-amber-orange"
                        onClick={() => searchFormik.resetForm()}
                        startIcon={<DisabledByDefault />}>
                        {t('button.clear')}
                    </Button>
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
                    <Grid item xs={12} sm={12}>
                        <Typography variant="h6" component="h2">
                            {t('productManagement.productList.searchPanel')}
                        </Typography>
                    </Grid>
                    <Grid item xs={12} sm={2} style={{ paddingTop: '30px' }}>
                        <TextField
                            type="text"
                            name="name"
                            label={t('productManagement.productList.column.name')}
                            fullWidth
                            variant="outlined"
                            value={searchFormik.values.nameContain}
                            onChange={({ target }) => {
                                searchFormik.setFieldValue('nameContain', target.value);
                                searchFormik.handleSubmit();
                            }}
                            InputLabelProps={{ shrink: true }}
                        />
                    </Grid>
                    <Grid item xs={12} sm={2} style={{ paddingTop: '30px' }}>
                        <TextField
                            type="text"
                            name="name"
                            label={t('productManagement.productList.column.sku')}
                            fullWidth
                            variant="outlined"
                            value={searchFormik.values.skuContain}
                            onChange={({ target }) => {
                                searchFormik.setFieldValue('skuContain', target.value);
                                searchFormik.handleSubmit();
                            }}
                            InputLabelProps={{ shrink: true }}
                        />
                    </Grid>
                    <Grid item xs={12} sm={2} style={{ paddingTop: '30px' }}>
                        <Autocomplete
                            disabled={isCategoryFetching}
                            options={categoryList || []}
                            sx={{ width: '100%' }}
                            value={searchFormik.values.categoryEqual}
                            onChange={(_event, value, reason) => {
                                if (reason === 'clear') {
                                    searchFormik.setFieldValue('categoryEqual', '');
                                    searchFormik.handleSubmit();
                                } else {
                                    searchFormik.setFieldValue('categoryEqual', value);
                                    searchFormik.handleSubmit();
                                }
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
                    <Grid item xs={12} sm={2} style={{ paddingTop: '30px' }}>
                        <Autocomplete
                            disabled={isGroupFetching}
                            options={groupList || []}
                            sx={{ width: '100%' }}
                            value={searchFormik.values.groupEqual}
                            onChange={(_event, value, reason) => {
                                if (reason === 'clear') {
                                    searchFormik.setFieldValue('groupEqual', '');
                                    searchFormik.handleSubmit();
                                } else {
                                    searchFormik.setFieldValue('groupEqual', value);
                                    searchFormik.handleSubmit();
                                }
                            }}
                            renderInput={(params) => (
                                <TextField
                                    {...params}
                                    label={t('productManagement.productList.column.group')}
                                    InputLabelProps={{ shrink: true }}
                                />
                            )}
                        />
                    </Grid>
                    <Grid item xs={12} sm={2} style={{ paddingTop: '30px' }}>
                        <Autocomplete
                            disabled={isSubgroupFetching}
                            options={subGroupList || []}
                            sx={{ width: '100%' }}
                            value={searchFormik.values.subGroupEqual}
                            onChange={(_event, value, reason) => {
                                if (reason === 'clear') {
                                    searchFormik.setFieldValue('subGroupEqual', '');
                                    searchFormik.handleSubmit();
                                } else {
                                    searchFormik.setFieldValue('subGroupEqual', value);
                                    searchFormik.handleSubmit();
                                }
                            }}
                            renderInput={(params) => (
                                <TextField
                                    {...params}
                                    label={t('productManagement.productList.column.subGroup')}
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
                                    <TableCell align="center" key="productName" width={250} className={classes.tableHeader}>
                                        {t('productManagement.productList.column.name')}
                                    </TableCell>
                                    <TableCell align="center" key="category" className={classes.tableHeader}>
                                        {t('productManagement.productList.column.category')}
                                    </TableCell>
                                    <TableCell align="center" key="group" className={classes.tableHeader}>
                                        {t('productManagement.productList.column.group')}
                                    </TableCell>
                                    <TableCell align="center" key="subGroup" className={classes.tableHeader}>
                                        {t('productManagement.productList.column.subGroup')}
                                    </TableCell>
                                    <TableCell align="center" key="keyword" className={classes.tableHeader}>
                                        {t('productManagement.productList.column.keyword')}
                                    </TableCell>
                                </TableRow>
                            </TableHead>
                            {isProductFetching ? (
                                <TableBody>
                                    <TableRow>
                                        <TableCell colSpan={5} align="center">
                                            <CircularProgress />
                                        </TableCell>
                                    </TableRow>
                                </TableBody>
                            ) : (
                                <TableBody>{products}</TableBody>
                            )}
                        </Table>
                    </TableContainer>
                </GridSearchSection>
                <GridSearchSection container>
                    <Grid item xs={12} sm={12}>
                        <Paginate
                            pagination={productList?.data.pagination}
                            page={page}
                            pageSize={pageSize}
                            setPage={setPage}
                            setPageSize={setPageSize}
                            refetch={productRefetched}
                            totalRecords={productList?.data.pagination.totalRecords}
                            isShow={true}
                        />
                    </Grid>
                </GridSearchSection>
            </Wrapper>
            <UploadProductDialog
                open={openUploadDialog}
                onSuccess={() => productRefetched()}
                onClose={(job) => {
                    setOpenUploadDialog(false);
                    setJobId(job);
                    if (job != '' && job != null && job !== undefined) {
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
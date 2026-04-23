/* eslint-disable prettier/prettier */
import { Search, DisabledByDefault, Add, DownloadForOffline, CloudUpload } from '@mui/icons-material';
import {
    Grid,
    Typography,
    Button,
    Table,
    TableCell,
    TableContainer,
    TableHead,
    TableRow,
    CircularProgress,
    TableBody,
    Box,
    Chip,
    Autocomplete,
    TextField,
    useMediaQuery,
    useTheme,
    Stack
} from '@mui/material';
import { makeStyles } from '@mui/styles';
import PageTitle from 'components/PageTitle';
import Paginate from 'components/Paginate';
import { GridSearchSection, Wrapper } from 'components/Styled';
import { useFormik } from 'formik';
import { Page } from 'layout/LayoutRoute';
import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { useQuery } from 'react-query';
import { useHistory } from 'react-router-dom';
import { deleteProductSupplier, exportProductSupplier, getProductConfig, getProductSupplier, getSuggestSupplierByProduct, searchProduct } from 'services/Product/product-api';
import {
    SearchProductSupplierRequest,
    ProductSupplier,
    ProductSupplierPrice,
    SuggestSupplier,
    ProductDto
} from 'services/Product/product-type';
import { formatMoney } from 'utils';
import ProductSupplierDialog from './ProductSupplierDialog';
import LoadingDialog from 'components/LoadingDialog';
import ConfirmDialog from 'components/ConfirmDialog';
import toast from 'react-hot-toast';
import { Supplier } from 'services/Supplier/supplier-type';
import UploadProductSupplierDialog from './UploadProductSupplierDialog';
import ProgressDialog from 'components/ProgressDialog';
import UpdatePriceDialog from './UpdatePriceDialog';

/* eslint-disable prettier/prettier */
export default function ProductSupplierManagement() {
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
    const [openLoadingDialog, setOpenLoadingDialog] = useState(false);
    const [visibleConfirmationDialog, setVisibleConfirmationDialog] = useState(false);
    const [productFilter, setProductFilter] = useState<SearchProductSupplierRequest>({})
    const [openPurchaseSupplierDialog, setOpenPurchaseSupplierDialog] = useState(false);
    const [openUpdatePriceDialog, setOpenUpdatePriceDialog] = useState(false);
    const [openUploadDialog, setOpenUploadDialog] = useState(false);
    const [selectedPurchaseSupplier, setSelectedPurchaseSupplier] = useState<ProductSupplier>();
    const [suggestSupplierList, setSuggestSupplierList] = useState<SuggestSupplier>();
    const [selectedSupplier, setSelectedSupplier] = useState<Supplier>();
    const [isOpenProgressDialog, setIsOpenProgressDialog] = useState(false)
    const [jobId, setJobId] = useState('')
    const [title, setTitle] = useState<string>('')
    const [msg, setMsg] = useState<string>('')
    const [action, setAction] = useState<string>('')
    const {
        data: productList,
        refetch: productRefetched,
        isFetching: isProductFetching
    } = useQuery('product-list', () => getProductSupplier(productFilter, page, pageSize), {
        refetchOnWindowFocus: false,
        keepPreviousData: true,
        onSuccess: (data) => {
            if (data?.data?.pagination) {
                setPage(data.data.pagination.page);
                setPageSize(data.data.pagination.size);
                setPages(data.data.pagination.totalPage);
            }
        }
    },);
    const { data: productsList, isFetching: isProductListFetching } = useQuery(
        'search-product',
        () => searchProduct({
            nameContain: '',
            skuContain: '',
            categoryEqual: '',
            groupEqual: '',
            subGroupEqual: '',
            parentSkuEqual: '',
            isIncludeParentSku: false
        }, 1, 3000),
        {
            refetchOnWindowFocus: false
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
    const {
        data: frequencyList,
        isFetching: isFrequencyFetching
    } = useQuery('frequency', () => getProductConfig('FREQUENCY'), {
        refetchOnWindowFocus: false
    });
    const searchFormik = useFormik({
        initialValues: {
            sku: '',
            categoryEqual: '',
            groupEqual: '',
            subGroupEqual: '',
            frequencyEqual: ''
        },
        enableReinitialize: false,
        onSubmit: (value) => {
            const updateObj = {
                categoryEqual: value.categoryEqual,
                sku: value.sku,
                groupEqual: value.groupEqual,
                subGroupEqual: value.subGroupEqual,
                frequencyEqual: value.frequencyEqual
            };
            setProductFilter(updateObj);
            productRefetched();
        }
    });
    const getSuggestSupplier = async (sku: string) => {
        const response = await getSuggestSupplierByProduct(sku);
        setOpenLoadingDialog(false);
        return response.data;
    }
    const products = (!isProductFetching &&
        productList &&
        productList?.data.products.length > 0 &&
        productList?.data.products.map((product: ProductSupplier) => {
            return (
                <TableRow
                    hover
                    id={`product__index-${product.productSku}`}
                    key={product.productSku}
                >
                    <TableCell>
                        <Typography>{product.product?.productNameTh}</Typography>
                        <Typography variant='caption' color="text.secondary" fontSize={'10px'}>
                            {'SKU:' + product.productSku}
                        </Typography>
                    </TableCell>
                    <TableCell>
                        {product.frequency}
                    </TableCell>
                    <TableCell>
                        {product.suppliers.map((supp: ProductSupplierPrice) => {
                            return (
                                <Chip
                                    style={{ margin: '0px 0px 0px 10px' }}
                                    key={supp.supplier.supplierId}
                                    label={supp.supplier.supplierShortName + ' (' + formatMoney(supp.price) + ')'}
                                    size="medium"
                                    color="primary"
                                    onClick={() => {
                                        setSelectedSupplier(supp.supplier);
                                        setSelectedPurchaseSupplier(product);
                                        setOpenUpdatePriceDialog(true);
                                    }}
                                    onDelete={() => {
                                        setTitle(t('productManagement.productSupplier.confirmDeleteTitle'));
                                        setMsg(t('productManagement.productSupplier.confirmDeleteMsg', { supplier: supp.supplier.supplierShortName, product: product.product?.productName }));
                                        setAction('DELETE');
                                        setVisibleConfirmationDialog(true);
                                        setSelectedPurchaseSupplier(product);
                                        setSelectedSupplier(supp.supplier);
                                    }}
                                />
                            )
                        })}

                        {/* Add New Supplier Chip */}
                        <Chip
                            icon={<Add />}
                            label={t('productManagement.productSupplier.addSupplier')}
                            color="success"
                            style={{ margin: '0px 0px 0px 10px', cursor: 'pointer' }}
                            onClick={() => handleAddSupplier(product)} // ฟังก์ชันที่คุณต้องจัดการ
                        />
                    </TableCell>
                </TableRow>
            )
        })) || (
            <TableRow>
                <TableCell colSpan={4}>
                    <div className={classes.noResultMessage}>{t('warning.noResultList')}</div>
                </TableCell>
            </TableRow>
        );
    const handleAddSupplier = async (product: ProductSupplier) => {
        setOpenLoadingDialog(true);
        const tmpSuggest = await getSuggestSupplier(product.product.productSku);
        setSuggestSupplierList(tmpSuggest);
        setSelectedPurchaseSupplier(product);
        setOpenPurchaseSupplierDialog(true);
    };

    const handleDeleteSupplier = async () => {
        setOpenLoadingDialog(true);
        toast.promise(deleteProductSupplier(selectedPurchaseSupplier?.product.productSku, selectedSupplier?.supplierId), {
            loading: t('toast.loading'),
            success: () => {
                productRefetched();
                return t('toast.success');
            },
            error: () => {
                return t('toast.failed');
            }
        })
            .finally(() => {
                setOpenLoadingDialog(false);
            });
    };
    const handleExportProduct = async () => {
        toast.promise(exportProductSupplier(productFilter), {
            loading: t('toast.loading'),
            success: (response) => {
                // Create a temporary URL for the Blob
                const url = window.URL.createObjectURL(new Blob([response.data]));

                let filename = 'สั่งใครดี.xlsx'; // fallback

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

    return (
        <Page>
            <PageTitle title={t('productManagement.productSupplier.title')} />
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
                        <Autocomplete
                            disabled={isProductListFetching}
                            options={productsList?.data.products.map((option: ProductDto) => option) || []}
                            getOptionLabel={(product: ProductDto) => product.productNameTh}
                            isOptionEqualToValue={(option, value) => option.productSku === value.productSku} // important!
                            filterOptions={(options, { inputValue }) => {
                                const search = inputValue.toLowerCase();

                                // 1. Filter ตามชื่อหรือ keyword
                                const filtered = options.filter((option) => {
                                    const keyword = (option.keywords || '').toLowerCase();
                                    const name = (option.productNameTh || '').toLowerCase();
                                    return name.includes(search) || keyword.includes(search);
                                });

                                // 2. Distinct ตาม productId
                                const seen = new Set();
                                const distinct = [];
                                for (const product of filtered) {
                                    if (!seen.has(product.productSku)) {
                                        seen.add(product.productSku);
                                        distinct.push(product);
                                    }
                                }

                                return distinct;
                            }}
                            renderOption={(props, option) => (
                                <li {...props} key={option.productSku}>
                                    {option.productNameTh}
                                </li>
                            )}
                            sx={{ minWidth: '180px' }}
                            value={
                                productsList?.data.products.find((p) => p.productSku === searchFormik.values.sku) || null
                            }
                            onChange={(_event, value: ProductDto, reason) => {
                                if (reason === 'clear') {
                                    searchFormik.setFieldValue('sku', '');
                                } else {
                                    searchFormik.setFieldValue('sku', value.productSku);
                                }
                            }}
                            renderInput={(params) => (
                                <TextField
                                    {...params}
                                    label={t('productManagement.productSupplier.column.name')}
                                    InputLabelProps={{ shrink: true }}
                                />
                            )}
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
                    <Grid item xs={12} sm={2} style={{ paddingTop: '30px' }}>
                        <Autocomplete
                            disabled={isFrequencyFetching}
                            options={frequencyList || []}
                            sx={{ width: '100%' }}
                            value={searchFormik.values.frequencyEqual}
                            onChange={(_event, value, reason) => {
                                if (reason === 'clear') {
                                    searchFormik.setFieldValue('frequencyEqual', '');
                                    searchFormik.handleSubmit();
                                } else {
                                    searchFormik.setFieldValue('frequencyEqual', value);
                                    searchFormik.handleSubmit();
                                }
                            }}
                            renderInput={(params) => (
                                <TextField
                                    {...params}
                                    label={t('productManagement.productSupplier.column.frequency')}
                                    InputLabelProps={{ shrink: true }}
                                />
                            )}
                        />
                    </Grid>
                </GridSearchSection>
                <GridSearchSection container spacing={1}>
                    <TableContainer component={Box} sx={{ overflowX: 'auto', maxWidth: '100%' }}>
                        <Table id="product_list___table">
                            <TableHead>
                                <TableRow>
                                    <TableCell align="center" key="productName" width={300} className={classes.tableHeader}>
                                        {t('productManagement.productSupplier.column.name')}
                                    </TableCell>
                                    <TableCell align="center" key="frequency" width={150} className={classes.tableHeader}>
                                        {t('productManagement.productSupplier.column.frequency')}
                                    </TableCell>
                                    <TableCell align="center" key="supplier" className={classes.tableHeader}>
                                        {t('productManagement.productSupplier.column.supplier')}
                                    </TableCell>
                                </TableRow>
                            </TableHead>
                            {isProductFetching ? (
                                <TableBody>
                                    <TableRow>
                                        <TableCell colSpan={3} align="center">
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
            <LoadingDialog
                open={openLoadingDialog}
            />
            <ProductSupplierDialog
                open={openPurchaseSupplierDialog}
                productSupplier={selectedPurchaseSupplier}
                suggestSuppliers={suggestSupplierList}
                onClose={() => {
                    setOpenPurchaseSupplierDialog(false);
                    productRefetched();
                }}
            />
            <UpdatePriceDialog
                open={openUpdatePriceDialog}
                productSupplier={selectedPurchaseSupplier}
                supplier={selectedSupplier}
                onClose={() => {
                    setOpenUpdatePriceDialog(false);
                    productRefetched();
                }}
            />
            <UploadProductSupplierDialog
                open={openUploadDialog}
                onClose={(job) => {
                    setOpenUploadDialog(false);
                    setJobId(job);
                    if (job != '' && jobId != null && jobId !== undefined) {
                        setIsOpenProgressDialog(true);
                    }
                }}
            />
            <ConfirmDialog
                open={visibleConfirmationDialog}
                title={title}
                message={msg}
                confirmText={t('button.confirm')}
                cancelText={t('button.cancel')}
                onConfirm={() => {
                    if (action === 'DELETE') {
                        handleDeleteSupplier();
                    }
                    setVisibleConfirmationDialog(false);
                }}
                onCancel={() => setVisibleConfirmationDialog(false)}
                isShowCancelButton={true}
                isShowConfirmButton={true}
            />
            <ProgressDialog
                open={isOpenProgressDialog}
                jobId={jobId}
                onConfirm={() => {
                    productRefetched()
                    setJobId('')
                    setIsOpenProgressDialog(false)
                }}
                onClose={() => setIsOpenProgressDialog(false)}
            />
        </Page>
    )
}
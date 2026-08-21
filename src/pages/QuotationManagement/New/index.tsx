/* eslint-disable prettier/prettier */
import { Add, ArrowBack, DeleteOutline, Replay, Save, Search } from "@mui/icons-material";
import { Box, Button, Chip, Dialog, DialogActions, DialogContent, DialogTitle, Divider, FormControlLabel, Grid, IconButton, ListItemIcon, MenuItem, Paper, Radio, RadioGroup, Stack, Table, TableBody, TableCell, TableHead, TableRow, TextField, Typography, useMediaQuery } from "@mui/material";
import { makeStyles } from "@mui/styles";
import PageTitle from "components/PageTitle";
import { GridTextField, Wrapper } from "components/Styled";
import { Page } from "layout/LayoutRoute";
import { useEffect, useRef, useState } from "react";
import { useTranslation } from "react-i18next";
import { useQuery } from "react-query";
import { useHistory, useParams } from "react-router-dom";
import { Address, Contact, Customer, UpdateCustomerRequest } from "services/Customer/customer-type";
import { getSales } from "services/Sales/sales-api";
import { getFreelanceSales } from "services/FreelanceSale/freelance-sale-api";
import { useTheme } from "styled-components";
import SearchCustomerDialog from "dialogs/QuotationManagement/New/SearchCustomerDialog";
import CreateFreelanceSaleDialog from "dialogs/QuotationManagement/New/CreateFreelanceSaleDialog";
import SearchFreelanceSalesDialog from "dialogs/QuotationManagement/New/SearchFreelanceSalesDialog";
import SearchRfqDialog from "dialogs/QuotationManagement/New/SearchRfqDialog";
import { ROUTE_PATHS } from "routes";
import { useFormik } from "formik";
import { getIn } from "formik";
import * as Yup from 'yup';
import dayjs from "dayjs";
import CollapsibleWrapper from "components/CollapsibleWrapper";
import DatePicker from "components/DatePicker";
import { DEFAULT_DATE_FORMAT, DEFAULT_DATE_FORMAT_BFF } from "utils";
import { CreateQuotationItem } from "services/Document/document-type";
import ConfirmDialog from "components/ConfirmDialog";
import { uploadFile } from "services/general-api";
import toast from "react-hot-toast";
import { createQuotation } from "services/Document/document-api";
import LoadingDialog from "components/LoadingDialog";
import { formatCurrency, formatNumber } from "utils/utils";
import { getRFQ } from "services/RFQ/rfq-api";
import { RFQDetailOption, RFQDetailTier, RFQRecord } from "services/RFQ/rfq-type";
import { addCustomerAddress, addCustomerContact, getCustomer, updateCustomer } from "services/Customer/customer-api";
import { CreateCustomerAddressRequest, CreateCustomerContactRequest } from "services/Customer/customer-type";
import { getDistrict, getProvince, getSubDistrict } from "services/Address/address-api";
import { District, Province, SubDistrict } from "services/Address/address-type";
import { GROUP_CODE, SystemConfig } from "services/Config/config-type";
import { getSystemConfig } from "services/Config/config-api";

const createEmptyRow = (): CreateQuotationItem => ({
    id: Date.now() + Math.floor(Math.random() * 1000),
    tierId: '',
    name: '',
    type: '',
    capacity: '',
    size: '',
    spec: '',
    unitPrice: 0,
    quantity: 0,
    unitPriceInput: '',
    amount: 0,
    imageFile: null,
    imagePreview: '',
    imageUrl: ''
});

const fieldSx = {
    '& .MuiOutlinedInput-root': {
        borderRadius: '12px',
        backgroundColor: '#fff',
        minHeight: 54
    },
    '& .MuiInputBase-input': {
        fontSize: 16,
        py: 1.8
    }
};
interface QuotationFromRFQParams {
    rfqId?: string;
}

const getConfigLabel = (config?: SystemConfig | null): string => {
    if (!config) return '';

    if (config.nameTh && config.nameEn) {
        return `${config.nameTh} (${config.nameEn})`;
    }

    return config.nameTh || config.nameEn || config.code || '';
};

const getProductFamilyLabel = (productFamily: RFQRecord['productFamily']): string => {
    if (!productFamily) return '';

    if (typeof productFamily === 'string') return productFamily;

    if (productFamily.nameTh && productFamily.nameEn) {
        return `${productFamily.nameTh} (${productFamily.nameEn})`;
    }

    return productFamily.nameTh || productFamily.nameEn || productFamily.code || '';
};

const getMaterialLabel = (material: RFQRecord['material']): string => {
    if (!material) return '';

    if (typeof material === 'string') return material;

    if (material.nameTh && material.nameEn) {
        return `${material.nameTh} (${material.nameEn})`;
    }

    return material.nameTh || material.nameEn || material.code || '';
};

const toTierPriceNumber = (value?: number | null): number => Number(value || 0);

const hasTierPrice = (value?: number | null): boolean => toTierPriceNumber(value) > 0;
const CO_SALE_MODE_NONE = 'NONE';
const CO_SALE_MODE_FREELANCE = 'FREELANCE';
const ADD_NEW_ADDRESS_VALUE = '__ADD_NEW_ADDRESS__';
const ADD_NEW_CONTACT_VALUE = '__ADD_NEW_CONTACT__';

function getShippingMethodLabel(
    shippingMethod: 'LAND' | 'SEA',
    isFcl?: boolean | null,
    isShareFCL?: boolean | null
): string {
    if (shippingMethod === 'SEA') {
        if (Boolean(isShareFCL)) {
            return 'ทางเรือแบบแชร์ปิดตู้';
        }

        if (Boolean(isFcl)) {
            return 'ทางเรือแบบปิดตู้';
        }

        return 'ทางเรือ';
    }

    return 'ทางรถ';
}

function QuotationItemMobileCard({
    row,
    index,
    activeRfqPictures,
    t,
    fieldSx,
    showItemErrors,
    itemErrors,
    onUpdateItem,
    onUploadImage,
    onRemoveImage,
    onSelectRfqPicture,
    onRemoveRow
}: {
    row: CreateQuotationItem;
    index: number;
    activeRfqPictures: RFQRecord['pictures'];
    t: (key: string) => string;
    fieldSx: any;
    showItemErrors: boolean;
    itemErrors: {
        name?: string;
        quantity?: string;
        unitPrice?: string;
    };
    onUpdateItem: (index: number, field: keyof CreateQuotationItem, value: any) => void;
    onUploadImage: (index: number, file?: File | null) => void;
    onRemoveImage: (index: number) => void;
    onSelectRfqPicture: (index: number, pictureUrl: string) => void;
    onRemoveRow: (index: number) => void;
}): JSX.Element {
    return (
        <Paper
            elevation={0}
            sx={{
                border: '1px solid #D9DCE3',
                borderRadius: '20px',
                p: 1.5,
                backgroundColor: '#fff'
            }}
        >
            <Stack spacing={1.5}>
                <Stack direction="row" justifyContent="space-between" alignItems="center" spacing={1}>
                    <Box
                        sx={{
                            width: 34,
                            height: 34,
                            borderRadius: '10px',
                            backgroundColor: '#F1F4F9',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            fontWeight: 700,
                            color: '#3A4256',
                            flexShrink: 0
                        }}
                    >
                        {index + 1}
                    </Box>
                    <IconButton
                        onClick={() => onRemoveRow(index)}
                        sx={{
                            borderRadius: '12px',
                            '&:hover': {
                                backgroundColor: '#FFF1F1'
                            }
                        }}
                    >
                        <DeleteOutline sx={{ color: '#B0B7C3' }} />
                    </IconButton>
                </Stack>

                <Stack spacing={1} alignItems="center">
                    <Box
                        sx={{
                            width: '100%',
                            height: 180,
                            border: '1px dashed #C8D0DB',
                            borderRadius: '14px',
                            overflow: 'hidden',
                            backgroundColor: '#FAFBFC',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center'
                        }}
                    >
                        {row.imagePreview ? (
                            <Box
                                component="img"
                                src={row.imagePreview}
                                alt="product"
                                sx={{
                                    width: '100%',
                                    height: '100%',
                                    objectFit: 'cover'
                                }}
                            />
                        ) : (
                            <Typography variant="caption" color="text.secondary" textAlign="center">
                                {t('documentManagement.quotation.itemSection.noImage')}
                            </Typography>
                        )}
                    </Box>

                    <Stack direction="row" spacing={1} useFlexGap flexWrap="wrap" justifyContent="center">
                        <Button
                            component="label"
                            variant="outlined"
                            size="small"
                            sx={{ borderRadius: '999px' }}
                        >
                            {t('documentManagement.quotation.itemSection.uploadImage')}
                            <input
                                hidden
                                accept="image/*"
                                type="file"
                                onChange={(e) => {
                                    const file = e.target.files?.[0];
                                    onUploadImage(index, file);
                                }}
                            />
                        </Button>

                        {row.imagePreview && (
                            <Button
                                color="error"
                                variant="outlined"
                                size="small"
                                sx={{ borderRadius: '999px' }}
                                onClick={() => onRemoveImage(index)}
                            >
                                {t('documentManagement.quotation.itemSection.removeImage')}
                            </Button>
                        )}

                        {(activeRfqPictures || []).length > 1 ? (
                            <Stack spacing={0.75}>
                                <Typography variant="caption" color="text.secondary">
                                    {t('documentManagement.quotation.itemSection.image')}
                                </Typography>
                                <Stack
                                    direction="row"
                                    spacing={0.75}
                                    sx={{
                                        overflowX: 'auto',
                                        pb: 0.5
                                    }}
                                >
                                    {(activeRfqPictures || []).map((picture, pictureIndex) => {
                                        const isSelected = row.imagePreview === picture.pictureUrl;

                                        return (
                                            <Box
                                                key={picture.id || picture.pictureUrl || pictureIndex}
                                                onClick={() => onSelectRfqPicture(index, picture.pictureUrl)}
                                                sx={{
                                                    width: 56,
                                                    minWidth: 56,
                                                    height: 56,
                                                    borderRadius: '10px',
                                                    overflow: 'hidden',
                                                    cursor: 'pointer',
                                                    border: isSelected
                                                        ? '2px solid #1F3F37'
                                                        : '1px solid #C8D0DB',
                                                    boxShadow: isSelected
                                                        ? '0 0 0 2px rgba(31, 63, 55, 0.16)'
                                                        : 'none',
                                                    opacity: isSelected ? 1 : 0.82,
                                                    transition: 'all 0.2s ease',
                                                    flexShrink: 0
                                                }}
                                            >
                                                <Box
                                                    component="img"
                                                    src={picture.pictureUrl}
                                                    alt={`rfq-picture-${pictureIndex + 1}`}
                                                    sx={{
                                                        width: '100%',
                                                        height: '100%',
                                                        objectFit: 'cover',
                                                        display: 'block'
                                                    }}
                                                />
                                            </Box>
                                        );
                                    })}
                                </Stack>
                            </Stack>
                        ) : null}
                    </Stack>
                </Stack>

                <Stack spacing={1.25}>
                        <TextField
                            fullWidth
                            required
                            label={t('documentManagement.quotation.itemSection.name')}
                            value={row.name}
                            onChange={(e) => onUpdateItem(index, 'name', e.target.value)}
                            variant="outlined"
                            sx={fieldSx}
                            error={Boolean(showItemErrors && itemErrors.name)}
                            helperText={showItemErrors ? itemErrors.name : ''}
                        />

                    <TextField
                        fullWidth
                        label={t('documentManagement.quotation.itemSection.spec')}
                        multiline
                        minRows={2}
                        value={row.spec}
                        onChange={(e) => onUpdateItem(index, 'spec', e.target.value)}
                        variant="outlined"
                        sx={{
                            '& .MuiOutlinedInput-root': {
                                borderRadius: '12px',
                                backgroundColor: '#fff'
                            },
                            '& .MuiInputBase-input': {
                                fontSize: 16
                            }
                        }}
                    />

                    <Stack direction="row" spacing={1.25}>
                        <TextField
                            fullWidth
                            type="text"
                            inputMode="decimal"
                            label={t('documentManagement.quotation.itemSection.quantity')}
                            value={row.quantity}
                            onChange={(e) => onUpdateItem(index, 'quantity', Number(e.target.value || 0))}
                            inputProps={{
                                min: 0,
                                style: { textAlign: 'center' }
                            }}
                            variant="outlined"
                            sx={{
                                '& .MuiOutlinedInput-root': {
                                    borderRadius: '12px',
                                    minHeight: 54,
                                    backgroundColor: '#fff'
                                },
                                '& .MuiInputBase-input': {
                                    fontSize: 16,
                                    fontWeight: 500
                                }
                            }}
                            error={Boolean(showItemErrors && itemErrors.quantity)}
                            helperText={showItemErrors ? itemErrors.quantity : ''}
                        />
                        <TextField
                            fullWidth
                            type="text"
                            inputMode="decimal"
                            label={t('documentManagement.quotation.itemSection.unitPrice')}
                            value={row.unitPrice}
                            onChange={(e) => onUpdateItem(index, 'unitPrice', e.target.value)}
                            variant="outlined"
                            sx={{
                                '& .MuiOutlinedInput-root': {
                                    borderRadius: '12px',
                                    minHeight: 54,
                                    backgroundColor: '#fff'
                                },
                                '& .MuiInputBase-input': {
                                    fontSize: 16,
                                    fontWeight: 500,
                                    textAlign: 'right'
                                }
                            }}
                            error={Boolean(showItemErrors && itemErrors.unitPrice)}
                            helperText={showItemErrors ? itemErrors.unitPrice : ''}
                        />
                    </Stack>

                    <Box
                        sx={{
                            display: 'flex',
                            justifyContent: 'space-between',
                            alignItems: 'center',
                            px: 0.5,
                            pt: 0.25
                        }}
                    >
                        <Typography variant="body2" color="text.secondary">
                            {t('documentManagement.quotation.itemSection.totalAmount')}
                        </Typography>
                        <Typography
                            fontWeight={700}
                            sx={{
                                fontSize: 20,
                                color: '#2F3447'
                            }}
                        >
                            {formatNumber(row.amount)}
                        </Typography>
                    </Box>
                </Stack>
            </Stack>
        </Paper>
    );
}

const formatApiDate = (value?: dayjs.Dayjs | string | null): string | undefined => {
    if (!value) {
        return undefined;
    }

    if (dayjs.isDayjs(value)) {
        return value.format(DEFAULT_DATE_FORMAT_BFF);
    }

    const parsed = parseDisplayDate(value);
    return parsed ? parsed.format(DEFAULT_DATE_FORMAT_BFF) : undefined;
};

const parseDisplayDate = (value?: string | dayjs.Dayjs | null): dayjs.Dayjs | null => {
    if (!value) {
        return null;
    }

    if (dayjs.isDayjs(value)) {
        return value;
    }

    const parsed = dayjs(value, DEFAULT_DATE_FORMAT, true);
    return parsed.isValid() ? parsed : null;
};

const matchesFreelanceSaleCoverage = (saleCoverage?: string | null, salesId?: string | null): boolean => {
    const normalizedSaleCoverage = (saleCoverage || '').trim();
    const normalizedSalesId = (salesId || '').trim();

    if (!normalizedSaleCoverage || !normalizedSalesId) {
        return false;
    }

    return normalizedSaleCoverage === normalizedSalesId;
};

const buildPaymentTermRemark = (paymentTerm?: Customer['customerPaymentTerm'] | null): string => {
    return paymentTerm?.nameTh || paymentTerm?.nameEn || paymentTerm?.code || '';
};

const createQuotationItemsFromRFQ = (rfq: RFQRecord): CreateQuotationItem[] => {
    const defaultImageUrl = (rfq.pictures || [])?.[0]?.pictureUrl || '';
    const type = getConfigLabel(rfq.orderType);
    const capacity = rfq.capacity || '';
    const productFamily = getProductFamilyLabel(rfq.productFamily);
    const material = getMaterialLabel(rfq.material);

    if (!rfq.details?.length) {
        return [{
            ...createEmptyRow(),
            name: productFamily,
            type,
            capacity,
            spec: [material, rfq.description].filter(Boolean).join('\n'),
            imagePreview: defaultImageUrl,
            imageUrl: defaultImageUrl
        }];
    }

    return rfq.details.flatMap((detail: RFQDetailOption) => {
        const tiers = detail.tiers?.length ? detail.tiers : [undefined];

        return tiers.flatMap((tier, tierIndex) => {
            const quantity = Number(tier?.quantity || 1);
            const baseName = `${detail.optionName || productFamily}`;
            const spec = detail.spec;
            const hasLandTotalPrice = hasTierPrice(tier?.landTotalPrice);
            const hasSeaTotalPrice = hasTierPrice(tier?.seaTotalPrice);

            const buildQuotationItem = (
                unitPrice: number,
                shippingMethodLabel?: string
            ): CreateQuotationItem => ({
                ...createEmptyRow(),
                tierId: tier?.id ? String(tier.id) : '',
                name: shippingMethodLabel ? `${baseName} (${shippingMethodLabel})` : baseName,
                type,
                capacity,
                spec,
                quantity,
                unitPrice,
                unitPriceInput: String(unitPrice),
                amount: quantity * unitPrice,
                imagePreview: defaultImageUrl,
                imageUrl: defaultImageUrl
            });

            if (hasLandTotalPrice && hasSeaTotalPrice) {
                return [
                    buildQuotationItem(toTierPriceNumber(tier?.landTotalPrice), 'ทางรถ'),
                    buildQuotationItem(
                        toTierPriceNumber(tier?.seaTotalPrice),
                        getShippingMethodLabel('SEA', tier?.isFcl, tier?.isShareFCL)
                    )
                ];
            }

            if (hasLandTotalPrice) {
                return [buildQuotationItem(toTierPriceNumber(tier?.landTotalPrice), 'ทางรถ')];
            }

            if (hasSeaTotalPrice) {
                return [
                    buildQuotationItem(
                        toTierPriceNumber(tier?.seaTotalPrice),
                        getShippingMethodLabel('SEA', tier?.isFcl, tier?.isShareFCL)
                    )
                ];
            }

            return [buildQuotationItem(toTierPriceNumber(tier?.productPrice))];
        });
    });
};

export default function NewQuotation() {
    const { t } = useTranslation();
    const theme = useTheme();
    const history = useHistory();
    const isMountedRef = useRef(true);
    const { rfqId } = useParams<QuotationFromRFQParams>();
    const isCreateFromRFQ = Boolean(rfqId);
    const isDownSm = useMediaQuery(theme.breakpoints.down('sm'));
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
    const [openSearchCustomerAndDocDialog, setOpenSearchCustomerAndDocDialog] = useState(!isCreateFromRFQ);
    const [openCreateFreelanceSaleDialog, setOpenCreateFreelanceSaleDialog] = useState(false);
    const [openSearchFreelanceSalesDialog, setOpenSearchFreelanceSalesDialog] = useState(false);
    const [openSearchRfqDialog, setOpenSearchRfqDialog] = useState(false);
    const [isAddCustomerAddressDialogOpen, setIsAddCustomerAddressDialogOpen] = useState(false);
    const [isAddCustomerContactDialogOpen, setIsAddCustomerContactDialogOpen] = useState(false);
    const [isUpdateCustomerDialogOpen, setIsUpdateCustomerDialogOpen] = useState(false);
    const [isLoading, setIsLoading] = useState(false);
    const [visibleConfirmationDialog, setVisibleConfirmationDialog] = useState(false);
    const [title, setTitle] = useState<string>('')
    const [msg, setMsg] = useState<string>('')
    const [action, setAction] = useState<string>('')
    const [customer, setCustomer] = useState<Customer | null>(null);
    const [selectedRfqFromDialog, setSelectedRfqFromDialog] = useState<RFQRecord | null>(null);
    const [selectedFreelanceSaleItem, setSelectedFreelanceSaleItem] = useState<FreelanceSaleRecord | null>(null);
    const [selectedFreelanceSaleLabel, setSelectedFreelanceSaleLabel] = useState<string>('');
    const today = dayjs();
    const { data: rfq, isFetching: isRFQFetching } = useQuery(
        ['quotation-from-rfq', rfqId],
        () => getRFQ(rfqId || ''),
        {
            enabled: isCreateFromRFQ,
            refetchOnWindowFocus: false
        }
    );
    const { data: salesOptions = [], isFetching: isSalesFetching } = useQuery(
        'quotation-sales-options',
        () => getSales(1, 20),
        { refetchOnWindowFocus: false }
    );
    const { data: provinces = [] } = useQuery('quotation-province', () => getProvince(), {
        refetchOnWindowFocus: false
    });
    const { data: districts = [] } = useQuery('quotation-district', () => getDistrict(), {
        refetchOnWindowFocus: false
    });
    const { data: subdistricts = [] } = useQuery('quotation-subdistrict', () => getSubDistrict(), {
        refetchOnWindowFocus: false
    });
    const { data: customerTypeList = [] } = useQuery(
        ['quotation-customer-type', GROUP_CODE.CUSTOMER_TYPE],
        () => getSystemConfig(GROUP_CODE.CUSTOMER_TYPE),
        { refetchOnWindowFocus: false }
    );
    const { data: customerTierList = [] } = useQuery(
        ['quotation-customer-tier', GROUP_CODE.CUSTOMER_TIER],
        () => getSystemConfig(GROUP_CODE.CUSTOMER_TIER),
        { refetchOnWindowFocus: false }
    );
    const { data: customerSegmentList = [] } = useQuery(
        ['quotation-customer-segment', GROUP_CODE.CUSTOMER_SEGMENT],
        () => getSystemConfig(GROUP_CODE.CUSTOMER_SEGMENT),
        { refetchOnWindowFocus: false }
    );
    const { data: customerCreditTermList = [] } = useQuery(
        ['quotation-customer-credit-term', GROUP_CODE.CUSTOMER_CREDIT_TERM],
        () => getSystemConfig(GROUP_CODE.CUSTOMER_CREDIT_TERM),
        { refetchOnWindowFocus: false }
    );
    const { data: customerPaymentTermList = [] } = useQuery(
        ['quotation-customer-payment-term', GROUP_CODE.CUSTOMER_PAYMENT_TERM],
        () => getSystemConfig(GROUP_CODE.CUSTOMER_PAYMENT_TERM),
        { refetchOnWindowFocus: false }
    );
    const { data: customerBillingConditionList = [] } = useQuery(
        ['quotation-customer-billing-condition', GROUP_CODE.CUSTOMER_BILLING_CONDITION],
        () => getSystemConfig(GROUP_CODE.CUSTOMER_BILLING_CONDITION),
        { refetchOnWindowFocus: false }
    );
    const { data: customerPaymentCycleList = [] } = useQuery(
        ['quotation-customer-payment-cycle', GROUP_CODE.CUSTOMER_PAYMENT_CYCLE],
        () => getSystemConfig(GROUP_CODE.CUSTOMER_PAYMENT_CYCLE),
        { refetchOnWindowFocus: false }
    );
    const { data: quotationExpireDayConfig = [] } = useQuery(
        ['quotation-expire-day', 'QUOTATION_EXPIRE_DAY'],
        () => getSystemConfig('QUOTATION_EXPIRE_DAY'),
        { refetchOnWindowFocus: false }
    );
    const quotationExpireDays = Math.max(
        1,
        Number(
            quotationExpireDayConfig?.[0]?.code
        ) || 7
    );
    const quotationDefaultEffectiveDate = today.add(quotationExpireDays, 'day');

    useEffect(() => {
        return () => {
            isMountedRef.current = false;
        };
    }, []);

    const addressDialogFormik = useFormik({
        initialValues: {
            addressType: 'BILLING',
            label: '',
            addressLine1: '',
            addressLine2: '',
            province: '',
            district: '',
            subdistrict: '',
            postcode: '',
            country: 'TH'
        },
        enableReinitialize: true,
        validationSchema: Yup.object().shape({
            addressType: Yup.string().required(),
            addressLine1: Yup.string().required(),
            province: Yup.string().required(),
            district: Yup.string().required(),
            subdistrict: Yup.string().required(),
            country: Yup.string().required()
        }),
        onSubmit: () => undefined
    });

    const contactDialogFormik = useFormik({
        initialValues: {
            contactName: '',
            contactNumber: ''
        },
        enableReinitialize: true,
        validationSchema: Yup.object().shape({
            contactName: Yup.string().max(255).nullable().notRequired(),
            contactNumber: Yup.string()
                .matches(/^[0-9]{9,10}$/, {
                    message: t('customerManagement.message.invalidPhoneNumberFormat'),
                    excludeEmptyString: true
                })
                .nullable()
                .notRequired()
        }),
        onSubmit: () => undefined
    });

    const updateCustomerDialogFormik = useFormik({
        initialValues: {
            customerName: customer?.customerName ?? '',
            email: customer?.email ?? '',
            type: customer?.customerType?.code ?? '',
            tier: customer?.customerTier?.code ?? '',
            segment: customer?.customerSegment?.code ?? '',
            taxId: customer?.taxId ?? '',
            companyName: customer?.companyName ?? '',
            companyBranchCode: customer?.branchNumber ?? '',
            companyBranchName: customer?.branchName ?? '',
            creditTerm: customer?.customerCreditTerm?.code ?? '',
            paymentTerm: customer?.customerPaymentTerm?.code ?? '',
            billingCondition: customer?.customerBillingCondition ?? '',
            paymentCycle: customer?.customerPaymentCycle ?? '',
            salesAccounts: customer?.salesAccounts?.length
                ? customer.salesAccounts
                : customer?.salesAccount
                    ? [customer.salesAccount]
                    : [],
            coSalesAccount: customer?.coSalesAccount ?? ''
        },
        enableReinitialize: true,
        validationSchema: Yup.object().shape({
            customerName: Yup.string().max(255).required(t('customerManagement.message.validateCustomerName')),
            type: Yup.string().max(255).required(t('customerManagement.message.validateType')),
            tier: Yup.string().max(255).nullable(),
            segment: Yup.string().max(255).nullable(),
            companyName: Yup.string().when('type', {
                is: 'COMPANY',
                then: Yup.string().required(t('customerManagement.message.validateCompanyName')),
                otherwise: Yup.string().nullable()
            }),
            companyBranchCode: Yup.string().when('type', {
                is: 'COMPANY',
                then: Yup.string().required(t('customerManagement.message.validateCompanyBranchCode')),
                otherwise: Yup.string().nullable()
            }),
            companyBranchName: Yup.string().when('type', {
                is: 'COMPANY',
                then: Yup.string().required(t('customerManagement.message.validateCompanyBranchName')),
                otherwise: Yup.string().nullable()
            }),
            creditTerm: Yup.string().max(255).required(t('customerManagement.message.validateCreditTerm')),
            paymentTerm: Yup.string().max(255).required(t('customerManagement.message.validatePaymentTerm'))
        }),
        onSubmit: async (values, actions) => {
            if (!customer?.id) {
                return;
            }

            actions.setSubmitting(true);
            const payload: UpdateCustomerRequest = {
                customerName: values.customerName || null,
                customerType: values.type || null,
                customerTier: values.tier || null,
                customerSegment: values.segment || null,
                email: values.email || null,
                taxId: values.taxId || null,
                companyName: values.companyName || null,
                branchNumber: values.companyBranchCode || null,
                branchName: values.companyBranchName || null,
                creditTerm: values.creditTerm || null,
                paymentTerm: values.paymentTerm || null,
                billingCondition: values.billingCondition || null,
                paymentCycle: values.paymentCycle || null,
                salesAccount: values.salesAccounts[0] || null,
                salesAccounts: values.salesAccounts,
                coSalesAccount: values.coSalesAccount || null
            };

            const updatePromise = updateCustomer(customer.id, payload).then(() => getCustomer(customer.id));

            toast.promise(updatePromise, {
                loading: t('toast.loading'),
                success: (response) => {
                    const updatedCustomer = response as Customer;
                    if (updatedCustomer) {
                        setCustomer(updatedCustomer);
                        formik.setFieldValue('salesId', updatedCustomer.salesAccounts?.[0] || updatedCustomer.salesAccount || '');
                        formik.setFieldValue('coSaleId', updatedCustomer.coSalesAccount || '');
                    }
                    setIsUpdateCustomerDialogOpen(false);
                    return t('toast.success');
                },
                error: t('toast.failed')
            });

            updatePromise.finally(() => {
                actions.setSubmitting(false);
            });
        }
    });

    const formik = useFormik({
        initialValues: {
            rfqId: rfqId || '',
            customerId: '',
            customerAddressId: '',
            customerContactId: '',
            docDate: today.format(DEFAULT_DATE_FORMAT),
            effectiveDate: quotationDefaultEffectiveDate.format(DEFAULT_DATE_FORMAT),
            salesId: '',
            coSaleId: '',
            coSaleMode: CO_SALE_MODE_NONE,
            remark: '',
            discount: 0,
            freight: 0,
            isVat: false,
            isShowSummary: false,
            shipping: '',
            items: [
                {
                    name: '',
                    type: '',
                    capacity: '',
                    spec: '',
                    quantity: 0,
                    unitPrice: 0,
                    amount: 0,
                    imageFile: null,
                    imagePreview: '',
                    imageUrl: ''
                }
            ]
        },
        enableReinitialize: false,
        validationSchema: Yup.object().shape({
            items: Yup.array()
                .of(
                    Yup.object().shape({
                        name: Yup.string()
                            .trim()
                            .required('ต้องระบุชื่อสินค้า'),
                        quantity: Yup.number()
                            .transform((value, originalValue) =>
                                originalValue === '' || originalValue === null ? undefined : Number(originalValue)
                            )
                            .typeError('ต้องระบุจำนวน')
                            .moreThan(0, 'จำนวนต้องมากกว่า 0')
                            .required('ต้องระบุจำนวน'),
                        unitPrice: Yup.number()
                            .transform((value, originalValue) =>
                                originalValue === '' || originalValue === null ? undefined : Number(originalValue)
                            )
                            .typeError('ต้องระบุราคาต่อชิ้น')
                            .moreThan(0, 'ราคาต่อชิ้นต้องมากกว่า 0')
                            .required('ต้องระบุราคาต่อชิ้น')
                    })
                )
                .min(1, 'At least one item is required')
                .required('Items are required')
        }),
        onSubmit: async (values) => {
            setIsLoading(true);
            const payload = {
                ...values,
                docDate: formatApiDate(values.docDate) || '',
                effectiveDate: formatApiDate(values.effectiveDate) || ''
            };
            toast
                .promise(createQuotation(payload), {
                    loading: t('toast.loading'),
                    success: (response) => {
                        const quotationNo = response?.data?.id;

                        history.push(
                            quotationNo
                                ? ROUTE_PATHS.QUOTATION_DETAIL.replace(':id', quotationNo)
                                : ROUTE_PATHS.QUOTATION_MANAGEMENT
                        );
                        return t('toast.success');
                    },
                    error: () => {
                        return t('toast.failed');
                    }
                })
                .finally(() => {
                    if (isMountedRef.current) {
                        setIsLoading(false);
                    }
                });
        }
    });

    const shouldLoadFreelanceSales = formik.values.coSaleMode === CO_SALE_MODE_FREELANCE;

    const { data: freelanceSales = [], isFetching: isFreelanceSalesFetching } = useQuery(
        'quotation-freelance-sales',
        () => getFreelanceSales(),
        {
            enabled: shouldLoadFreelanceSales,
            refetchOnWindowFocus: false
        }
    );
    const selectedFreelanceSale = selectedFreelanceSaleItem || freelanceSales.find(
        (option) => option.id === formik.values.coSaleId
    ) || null;
    const selectedFreelanceSaleDisplay = selectedFreelanceSaleLabel
        || (selectedFreelanceSale ? `${selectedFreelanceSale.id} - ${selectedFreelanceSale.name}` : '')
        || formik.values.coSaleId
        || '';

    useEffect(() => {
        if (!rfq) return;

        const customerAddresses = rfq.customer?.addresses || [];
        const customerContacts = rfq.customer?.contacts || [];
        const defaultAddress =
            customerAddresses.find((address) => address.isDefault) ||
            customerAddresses[0];
        const defaultContact =
            customerContacts.find((contact) => contact.contactName === rfq.contactName) ||
            customerContacts.find((contact) => contact.isDefault) ||
            customerContacts[0];
        const salesId =
            rfq.sales?.salesId ||
            rfq.sales?.employeeId ||
            rfq.customer?.salesAccounts?.[0] ||
            rfq.customer?.salesAccount ||
            '';
        const rfqAdditionalCostTotal = (rfq.additionalCosts || []).reduce(
            (sum, cost) => sum + Number(cost.value || 0),
            0
        );

        setCustomer(rfq.customer ? {
            ...rfq.customer,
            addresses: customerAddresses,
            contacts: customerContacts
        } as Customer : null);
        formik.setValues({
            ...formik.values,
            rfqId: rfqId || '',
            customerId: rfq.customer?.id || '',
            customerAddressId: defaultAddress?.id || '',
            customerContactId: defaultContact?.id || '',
            docDate: today.format(DEFAULT_DATE_FORMAT),
            effectiveDate: quotationDefaultEffectiveDate.format(DEFAULT_DATE_FORMAT),
            salesId,
            coSaleId: rfq.customer?.coSalesAccount || '',
            coSaleMode: rfq.customer?.coSalesAccount ? CO_SALE_MODE_FREELANCE : CO_SALE_MODE_NONE,
            remark: buildPaymentTermRemark(rfq.customer?.customerPaymentTerm),
            shipping: rfq.shippingMethod || 'ALL',
            freight: rfqAdditionalCostTotal,
            items: createQuotationItemsFromRFQ(rfq)
        });
    }, [rfq]);

    useEffect(() => {
        if (!formik.values.coSaleId) return;

        const selectedFreelanceSale = freelanceSales.find(
            (option) => option.id === formik.values.coSaleId
        );

        if (!selectedFreelanceSale) return;

        const isMatchedCoverage = matchesFreelanceSaleCoverage(
            selectedFreelanceSale.saleCoverage,
            formik.values.salesId
        );

        if (!isMatchedCoverage) {
            formik.setFieldValue('coSaleId', '');
            setSelectedFreelanceSaleItem(null);
            setSelectedFreelanceSaleLabel('');
        }
    }, [formik.values.coSaleId, formik.values.salesId, freelanceSales]);

    useEffect(() => {
        if (formik.values.coSaleMode === CO_SALE_MODE_NONE && formik.values.coSaleId) {
            formik.setFieldValue('coSaleId', '');
            setSelectedFreelanceSaleItem(null);
            setSelectedFreelanceSaleLabel('');
        }
    }, [formik.values.coSaleId, formik.values.coSaleMode]);

    useEffect(() => {
        if (!formik.values.coSaleId) {
            setSelectedFreelanceSaleItem(null);
            setSelectedFreelanceSaleLabel('');
            return;
        }

        const matchedFreelanceSale = freelanceSales.find(
            (option) => option.id === formik.values.coSaleId
        );

        if (matchedFreelanceSale) {
            setSelectedFreelanceSaleItem(matchedFreelanceSale);
            setSelectedFreelanceSaleLabel(`${matchedFreelanceSale.id} - ${matchedFreelanceSale.name}`);
        }
    }, [formik.values.coSaleId, freelanceSales]);

    useEffect(() => {
        const fallbackEffectiveDate = today.add(30, 'day');
        const currentEffectiveDate = formik.values.effectiveDate
            ? dayjs(formik.values.effectiveDate)
            : null;
        const targetEffectiveDate = today.add(quotationExpireDays, 'day');

        if (!currentEffectiveDate || currentEffectiveDate.isSame(fallbackEffectiveDate, 'day')) {
            formik.setFieldValue('effectiveDate', targetEffectiveDate.format(DEFAULT_DATE_FORMAT), false);
        }
    }, [quotationExpireDays]);

    const handleOpenAddCustomerAddressDialog = () => {
        if (!customer?.id) {
            toast.error('กรุณาเลือกลูกค้าก่อน');
            return;
        }

        addressDialogFormik.resetForm({
            values: {
                addressType: 'BILLING',
                label: '',
                addressLine1: '',
                addressLine2: '',
                province: '',
                district: '',
                subdistrict: '',
                postcode: '',
                country: 'TH'
            }
        });
        setIsAddCustomerAddressDialogOpen(true);
    };

    const getAddressPayload = (): CreateCustomerAddressRequest => {
        const values = addressDialogFormik.values;
        const selectedProvince = provinces.find((item: Province) => item.id === values.province);
        const selectedDistrict = districts.find((item: District) => item.id === values.district);
        const selectedSubdistrict = subdistricts.find((item: SubDistrict) => item.id === values.subdistrict);

        return {
            addressType: values.addressType,
            label: values.label,
            isDefault: false,
            addressLine1: values.addressLine1,
            addressLine2: values.addressLine2,
            subdistrict: selectedSubdistrict?.nameTh,
            district: selectedDistrict?.nameTh,
            province: selectedProvince?.nameTh,
            postcode: values.postcode,
            country: values.country
        };
    };

    const handleConfirmAddCustomerAddress = async () => {
        if (!customer?.id) {
            return;
        }

        const errors = await addressDialogFormik.validateForm();
        addressDialogFormik.setTouched({
            addressType: true,
            label: true,
            addressLine1: true,
            addressLine2: true,
            province: true,
            district: true,
            subdistrict: true,
            country: true
        });

        if (Object.keys(errors).length > 0) {
            return;
        }

        addressDialogFormik.setSubmitting(true);
        const addAddressPromise = addCustomerAddress(customer.id, getAddressPayload());

        toast.promise(addAddressPromise, {
            loading: t('toast.loading'),
            success: (response) => {
                const updatedCustomer = ((response as any)?.data ?? response) as Customer;
                setCustomer(updatedCustomer);

                const updatedAddresses = updatedCustomer.addresses || [];
                const selectedAddress =
                    updatedAddresses.find((address) => address.isDefault) ||
                    updatedAddresses[updatedAddresses.length - 1];

                if (selectedAddress?.id) {
                    formik.setFieldValue('customerAddressId', selectedAddress.id);
                }

                addressDialogFormik.resetForm();
                setIsAddCustomerAddressDialogOpen(false);
                return t('toast.success');
            },
            error: t('toast.failed')
        });

        addAddressPromise.finally(() => {
            addressDialogFormik.setSubmitting(false);
        });
    };

    const handleOpenAddCustomerContactDialog = () => {
        if (!customer?.id) {
            toast.error('กรุณาเลือกลูกค้าก่อน');
            return;
        }

        contactDialogFormik.resetForm({
            values: {
                contactName: '',
                contactNumber: ''
            }
        });
        setIsAddCustomerContactDialogOpen(true);
    };

    const handleOpenUpdateCustomer = () => {
        if (!customer?.id) {
            return;
        }

        updateCustomerDialogFormik.resetForm();
        setIsUpdateCustomerDialogOpen(true);
    };

    const getContactPayload = (): CreateCustomerContactRequest => ({
        contactName: contactDialogFormik.values.contactName,
        contactNumber: contactDialogFormik.values.contactNumber
    });

    const handleConfirmAddCustomerContact = async () => {
        if (!customer?.id) {
            return;
        }

        const errors = await contactDialogFormik.validateForm();
        contactDialogFormik.setTouched({
            contactName: true,
            contactNumber: true
        });

        if (Object.keys(errors).length > 0) {
            return;
        }

        contactDialogFormik.setSubmitting(true);
        const addContactPromise = addCustomerContact(customer.id, getContactPayload());

        toast.promise(addContactPromise, {
            loading: t('toast.loading'),
            success: (response) => {
                const updatedCustomer = ((response as any)?.data ?? response) as Customer;
                setCustomer(updatedCustomer);

                const updatedContacts = updatedCustomer.contacts || [];
                const selectedContact =
                    updatedContacts.find((contact) => contact.isDefault) ||
                    updatedContacts[updatedContacts.length - 1];

                if (selectedContact?.id) {
                    formik.setFieldValue('customerContactId', selectedContact.id);
                }

                contactDialogFormik.resetForm();
                setIsAddCustomerContactDialogOpen(false);
                return t('toast.success');
            },
            error: t('toast.failed')
        });

        addContactPromise.finally(() => {
            contactDialogFormik.setSubmitting(false);
        });
    };

    const isGeneralSectionCompleted =
        !!formik.values.docDate &&
        !!formik.values.effectiveDate &&
        !!formik.values.salesId &&
        formik.values.isVat !== undefined;

    const isCustomerSectionCompleted =
        !!formik.values.customerId &&
        !!formik.values.customerAddressId;

    const isItemSectionCompleted =
        formik.values.items.length > 0 &&
        formik.values.items.every((item) => {
            const hasName = !!item.name?.trim();
            const hasQuantity = Number(item.quantity) > 0;
            const hasPrice = Number(item.unitPrice) > 0;

            return hasName && hasQuantity && hasPrice;
        });

    const isQuotationFormCompleted =
        isCustomerSectionCompleted &&
        isGeneralSectionCompleted &&
        isItemSectionCompleted;

    const getItemFieldError = (index: number, field: 'name' | 'quantity' | 'unitPrice') => {
        const touched = getIn(formik.touched, `items[${index}].${field}`);
        const error = getIn(formik.errors, `items[${index}].${field}`);

        if (!error) {
            return '';
        }

        return touched || formik.submitCount > 0 ? String(error) : '';
    };

    const getItemErrorState = (index: number) => ({
        name: getItemFieldError(index, 'name'),
        quantity: getItemFieldError(index, 'quantity'),
        unitPrice: getItemFieldError(index, 'unitPrice')
    });

    const updateItem = (index: number, field: string, value: any) => {
        const items = [...formik.values.items];

        items[index][field] = value;

        const quantity = Number(items[index].quantity || 0);
        const unitPrice = Number(items[index].unitPrice || 0);

        items[index].amount = quantity * unitPrice;

        formik.setFieldValue('items', items);
    };

    const addNewRow = () => {
        const items = [...formik.values.items];

        items.push({
            name: '',
            type: '',
            capacity: '',
            spec: '',
            quantity: 0,
            unitPrice: 0,
            amount: 0,
            imageFile: null,
            imagePreview: '',
            imageUrl: ''
        });

        formik.setFieldValue('items', items);
    };

    const handleOpenCreateFreelanceSaleDialog = () => {
        setOpenCreateFreelanceSaleDialog(true);
    };

    const removeRow = (index: number) => {
        const items = [...formik.values.items];

        if (items.length === 1) return;

        items.splice(index, 1);

        formik.setFieldValue('items', items);
    };

    const handleUploadImage = async (index: number, file?: File | null) => {
        if (!file) return;

        setIsLoading(true)
        const uploadResult = await uploadFile(file);
        setIsLoading(false)

        const items = [...formik.values.items];
        items[index] = {
            ...items[index],
            imageFile: file,
            imagePreview: uploadResult.url,
            imageUrl: uploadResult.url
        };

        formik.setFieldValue('items', items);
    };

    const removeImage = (index: number) => {
        const items = [...formik.values.items];

        items[index].imageFile = null;
        items[index].imagePreview = '';
        items[index].imageUrl = '';

        formik.setFieldValue('items', items);
    };

    const handleLoadItemsFromRfq = () => {
        if (!customer?.id) {
            toast.error('กรุณาเลือกลูกค้าก่อน');
            return;
        }

        setOpenSearchRfqDialog(true);
    };

    const handleSelectRfq = async (selectedRfq: RFQRecord) => {
        setIsLoading(true);

        try {
            const fullRfq = await getRFQ(selectedRfq.id);
            setSelectedRfqFromDialog(fullRfq);
            formik.setFieldValue('rfqId', fullRfq.id);
            formik.setFieldValue('items', createQuotationItemsFromRFQ(fullRfq));
            setOpenSearchRfqDialog(false);
            toast.success('ดึงรายการสินค้าจาก RFQ เรียบร้อย');
        } catch (error) {
            toast.error('ไม่สามารถดึงข้อมูล RFQ ได้');
        } finally {
            setIsLoading(false);
        }
    };

    const handleSelectRfqPicture = (index: number, pictureUrl: string) => {
        const items = [...formik.values.items];

        items[index] = {
            ...items[index],
            imageFile: null,
            imagePreview: pictureUrl,
            imageUrl: pictureUrl
        };

        formik.setFieldValue('items', items);
    };

    const subTotal = (formik.values.items || []).reduce(
        (sum, item) => sum + Number(item.amount || 0),
        0
    );

    const discount = Number(formik.values.discount || 0);
    const freight = Number(formik.values.freight || 0);

    const taxableAmount = Math.max(subTotal - discount, 0);

    const vatRate = 0.07;
    const vatAmount = formik.values.isVat ? taxableAmount * vatRate : 0;

    const grandTotal = taxableAmount + vatAmount + freight;
    const activeRfq = rfq || selectedRfqFromDialog;

    return (
        <Page>
            <PageTitle title={t('documentManagement.quotation.newQuotation')} />
            <CollapsibleWrapper
                title={t('documentManagement.quotation.generalSection')}
                isCompleted={isGeneralSectionCompleted}
                defaultExpanded={true}
            >
                <Grid container spacing={1}>
                    <GridTextField item xs={12} sm={2} style={{ paddingTop: '30px' }}>
                        <DatePicker
                            className={classes.datePickerFromTo}
                            fullWidth
                            inputVariant="outlined"
                            InputLabelProps={{ shrink: true }}
                            required
                            label={t('documentManagement.quotation.docDate')}
                            format={DEFAULT_DATE_FORMAT}
                            value={
                                parseDisplayDate(formik.values.docDate)?.toDate() || null
                            }
                            onChange={(date) => {
                                if (!date) {
                                    formik.setFieldValue('docDate', '');
                                    return;
                                }

                                const startDate = dayjs(date.toDate()).startOf('day');

                                formik.setFieldValue(
                                    'docDate',
                                    startDate.format(DEFAULT_DATE_FORMAT)
                                );

                                // ✅ ถ้า end < start → auto ปรับ end = start
                                if (
                                    formik.values.effectiveDate &&
                                    parseDisplayDate(formik.values.effectiveDate)?.isBefore(startDate)
                                ) {
                                    formik.setFieldValue(
                                        'effectiveDate',
                                        startDate.format(DEFAULT_DATE_FORMAT)
                                    );
                                }
                            }}
                        />
                    </GridTextField>

                    <GridTextField item xs={12} sm={2} style={{ paddingTop: '30px' }}>
                        <DatePicker
                            className={classes.datePickerFromTo}
                            fullWidth
                            inputVariant="outlined"
                            required
                            InputLabelProps={{ shrink: true }}
                            label={t('documentManagement.quotation.expectiveDate')}
                            format={DEFAULT_DATE_FORMAT}
                            minDate={
                                parseDisplayDate(formik.values.docDate)?.toDate()
                            }
                            value={
                                parseDisplayDate(formik.values.effectiveDate)?.toDate() || null
                            }
                            onChange={(date) => {
                                if (!date) {
                                    formik.setFieldValue('effectiveDate', '');
                                    return;
                                }

                                const endDate = dayjs(date.toDate()).startOf('day');
                                const startDate = parseDisplayDate(formik.values.docDate);

                                // ❌ กันกรณีเลือกน้อยกว่า start
                                if (startDate && endDate.isBefore(startDate)) {
                                    return;
                                }

                                formik.setFieldValue(
                                    'effectiveDate',
                                    endDate.format(DEFAULT_DATE_FORMAT)
                                );
                            }}
                        />
                    </GridTextField>

                    <GridTextField item sm={8} />

                    <GridTextField item xs={12} sm={6}>
                        <Box>
                            <Typography
                                variant="body2"
                                sx={{ color: 'text.secondary', fontWeight: 500, px: 0.25 }}>
                                ภาษีมูลค่าเพิ่ม
                            </Typography>
                            <RadioGroup
                                row
                                value={String(formik.values.isVat)}
                                onChange={(e) => formik.setFieldValue('isVat', e.target.value === 'true')}
                            >
                                <FormControlLabel value="true" control={<Radio />} label="มี VAT" />
                                <FormControlLabel value="false" control={<Radio />} label="ไม่มี VAT" />
                            </RadioGroup>
                        </Box>
                    </GridTextField>

                    <GridTextField item xs={12} sm={6}>
                        <Box>
                            <Typography
                                variant="body2"
                                sx={{ color: 'text.secondary', fontWeight: 500, px: 0.25 }}>
                                เซลล์นอก/เซลล์ฟรีแลนซ์
                            </Typography>
                            <RadioGroup
                                row
                                value={formik.values.coSaleMode}
                                onChange={(e) => formik.setFieldValue('coSaleMode', e.target.value)}
                            >
                                <FormControlLabel value={CO_SALE_MODE_NONE} control={<Radio />} label="ไม่มี" />
                                <FormControlLabel value={CO_SALE_MODE_FREELANCE} control={<Radio />} label="เซลล์นอก/เซลล์ฟรีแลนซ์" />
                            </RadioGroup>
                        </Box>
                    </GridTextField>

                    <GridTextField item xs={12} sm={6}>
                        <TextField
                            select
                            fullWidth
                            required
                            label={t('customerManagement.column.salesAccount')}
                            InputLabelProps={{ shrink: true }}
                            error={Boolean(formik.touched.salesId && formik.errors.salesId)}
                            helperText={formik.touched.salesId && formik.errors.salesId}
                            value={formik.values.salesId || ''}
                            disabled={isSalesFetching}
                            onChange={(event) => {
                                const selectedCode = event.target.value;
                                formik.setFieldValue('salesId', selectedCode);
                            }}>
                            <MenuItem value="">{t('general.clearSelected')}</MenuItem>
                            {salesOptions.map((option) => (
                                <MenuItem key={option.salesId} value={option.salesId}>
                                    {`${option.salesId} - ${option.nickname || option.name}`}
                                </MenuItem>
                            ))}
                        </TextField>
                    </GridTextField>

                    {formik.values.coSaleMode !== CO_SALE_MODE_NONE ? (
                        <GridTextField item xs={12} sm={6}>
                            <TextField
                                label="เซลล์นอก/เซลล์ฟรีแลนซ์"
                                fullWidth
                                value={selectedFreelanceSaleDisplay}
                                variant="outlined"
                                InputLabelProps={{ shrink: true }}
                                InputProps={{
                                    readOnly: true,
                                    endAdornment: (
                                        <IconButton
                                            edge="end"
                                            onClick={() => setOpenSearchFreelanceSalesDialog(true)}
                                            disabled={isFreelanceSalesFetching}
                                        >
                                            <Search />
                                        </IconButton>
                                    )
                                }}
                            />
                        </GridTextField>
                    ) : (
                        <GridTextField item xs={12} sm={6} />
                    )}

                    <GridTextField item xs={12} sm={6}>
                        <Box>
                            <Typography
                                variant="body2"
                                sx={{ color: 'text.secondary', fontWeight: 500, px: 0.25 }}>
                                ยอดรวม
                            </Typography>
                            <RadioGroup
                                row
                                value={String(formik.values.isShowSummary)}
                                onChange={(e) => formik.setFieldValue('isShowSummary', e.target.value === 'true')}
                            >
                                <FormControlLabel value="true" control={<Radio />} label="แสดงยอดรวม" />
                                <FormControlLabel value="false" control={<Radio />} label="ไม่แสดงยอดรวม" />
                            </RadioGroup>
                        </Box>
                    </GridTextField>
                    <GridTextField item sm={6} />
                    <GridTextField item xs={12} sm={6}>
                        <Box>
                            <Typography
                                variant="body2"
                                sx={{ color: 'text.secondary', fontWeight: 500, px: 0.25 }}>
                                การขนส่ง
                            </Typography>
                            <RadioGroup
                                row
                                name="shipping"
                                value={formik.values.shipping}
                                onChange={formik.handleChange}>
                                <FormControlLabel value="ALL" control={<Radio size="small" />} label="ทางรถ/ทางเรือ" />
                                <FormControlLabel value="LAND" control={<Radio size="small" />} label="ทางรถ" />
                                <FormControlLabel value="SEA" control={<Radio size="small" />} label="ทางเรือ" />
                                <FormControlLabel value="AIR" control={<Radio size="small" />} label="ทางเครื่องบิน" />
                            </RadioGroup>
                        </Box>
                    </GridTextField>
                </Grid>
            </CollapsibleWrapper>
            <CollapsibleWrapper
                title={t('documentManagement.quotation.customerSection.title')}
                isCompleted={isCustomerSectionCompleted}
                defaultExpanded={true}
                action={
                    customer?.id ? (
                        <Button
                            variant="outlined"
                            size="small"
                            onClick={handleOpenUpdateCustomer}
                            sx={{
                                borderRadius: '999px',
                                px: 2,
                                py: 0.75,
                                fontWeight: 700,
                                whiteSpace: 'nowrap'
                            }}
                        >
                            อัพเดตข้อมูล
                        </Button>
                    ) : null
                }
            >
                <Grid container spacing={1}>
                    {/* customerName */}
                    <GridTextField item xs={12} sm={6}>
                        <TextField
                            name="customerName"
                            type="text"
                            label={t('customerManagement.column.id')}
                            fullWidth
                            variant="outlined"
                            value={customer?.id}
                            InputLabelProps={{ shrink: true }}
                            InputProps={{ readOnly: true }}
                        />
                    </GridTextField>
                    <GridTextField item xs={12} sm={6}>
                        <TextField
                            name="customerName"
                            type="text"
                            label={t('customerManagement.column.name')}
                            fullWidth
                            variant="outlined"
                            value={customer?.customerName}
                            InputLabelProps={{ shrink: true }}
                        />
                    </GridTextField>
                    <GridTextField item xs={12} sm={6}>
                        <TextField
                            name="taxId"
                            type="text"
                            label={t('customerManagement.column.taxId')}
                            fullWidth
                            variant="outlined"
                            value={customer?.taxId}
                            InputLabelProps={{ shrink: true }}
                        />
                    </GridTextField>
                    {customer?.customerType?.code === 'COMPANY' ?
                        <>
                            <GridTextField item xs={12} sm={6}>
                                <TextField
                                    name="taxId"
                                    type="text"
                                    label={t('documentManagement.quotation.customerSection.branch')}
                                    fullWidth
                                    variant="outlined"
                                    value={'(' + customer?.branchNumber + ') ' + customer?.branchName}
                                    InputLabelProps={{ shrink: true }}
                                />
                            </GridTextField>
                        </> :
                        <> </>
                    }
                    <GridTextField item xs={12} sm={6}>
                        <TextField
                            name="customerPaymentTerm"
                            type="text"
                            label={t('customerManagement.column.paymentTerm')}
                            fullWidth
                            variant="outlined"
                            value={
                                customer?.customerPaymentTerm?.nameTh ||
                                customer?.customerPaymentTerm?.nameEn ||
                                customer?.customerPaymentTerm?.code ||
                                ''
                            }
                            InputLabelProps={{ shrink: true }}
                            InputProps={{ readOnly: true }}
                        />
                    </GridTextField>
                    <GridTextField item xs={12} sm={12}>
                        <TextField
                            select
                            name="customerAddressId"
                            label={t('customerManagement.column.address.title')}
                            fullWidth
                            variant="outlined"
                            value={formik.values.customerAddressId || ''}
                            onChange={(e) => {
                                if (e.target.value === ADD_NEW_ADDRESS_VALUE) {
                                    handleOpenAddCustomerAddressDialog();
                                    return;
                                }
                                formik.setFieldValue('customerAddressId', e.target.value);
                            }}
                            InputLabelProps={{ shrink: true }}
                            helperText={
                                (customer?.addresses || []).length
                                    ? undefined
                                    : t('customerManagement.column.address.noAddress')
                            }
                        >
                            {(customer?.addresses || []).map((address: Address) => (
                                <MenuItem key={address.id} value={address.id}>
                                    <Stack direction="row" spacing={1} alignItems="center">

                                        {/* Address Type Tag */}
                                        <Chip
                                            size="small"
                                            label={t(`customerManagement.column.addressType.${address.addressType.toLowerCase()}`)}
                                            variant="outlined"
                                        />

                                        {/* Address */}
                                        <span>{address.fullAddress}</span>

                                    </Stack>
                                </MenuItem>
                            ))}
                            <MenuItem value={ADD_NEW_ADDRESS_VALUE}>
                                <ListItemIcon sx={{ minWidth: 32 }}>
                                    <Add fontSize="small" />
                                </ListItemIcon>
                                {t('customerManagement.column.address.addNew')}
                            </MenuItem>
                        </TextField>
                    </GridTextField>
                    <GridTextField item xs={12} sm={12}>
                        <TextField
                            select
                            name="customerContactId"
                            label={t('customerManagement.column.contact')}
                            fullWidth
                            variant="outlined"
                            value={formik.values.customerContactId || ''}
                            onChange={(e) => {
                                if (e.target.value === ADD_NEW_CONTACT_VALUE) {
                                    handleOpenAddCustomerContactDialog();
                                    return;
                                }
                                formik.setFieldValue('customerContactId', e.target.value);
                            }}
                            InputLabelProps={{ shrink: true }}
                        >
                            {(customer?.contacts || []).map((contact: Contact) => (
                                <MenuItem key={contact.id} value={contact.id}>
                                    <Stack direction="row" spacing={1} alignItems="center">
                                        <span>{contact.contactName + " : " + contact.contactNumber}</span>
                                    </Stack>
                                </MenuItem>
                            ))}
                            <MenuItem value={ADD_NEW_CONTACT_VALUE}>
                                <ListItemIcon sx={{ minWidth: 32 }}>
                                    <Add fontSize="small" />
                                </ListItemIcon>
                                {t('customerManagement.addContact')}
                            </MenuItem>
                        </TextField>
                    </GridTextField>
                </Grid>
            </CollapsibleWrapper>
            <CollapsibleWrapper
                title={t('documentManagement.quotation.itemSection.title')}
                isCompleted={isItemSectionCompleted}
                defaultExpanded={true}
                action={!isCreateFromRFQ ? (
                    <Button
                        variant="outlined"
                        size="small"
                        startIcon={<Replay />}
                        onClick={handleLoadItemsFromRfq}
                        disabled={rfq}
                        sx={{
                            borderRadius: '999px',
                            px: 2,
                            py: 0.75,
                            fontWeight: 700,
                            whiteSpace: 'nowrap'
                        }}
                    >
                        ดึงรายการสินค้าจาก RFQ
                    </Button>
                ) : null}
            >
                {isDownSm ? (
                    <Stack spacing={1.5}>
                        {formik.values.items.map((row, index) => {
                            const itemErrors = getItemErrorState(index);
                            const showItemErrors = formik.submitCount > 0;

                            return (
                                <QuotationItemMobileCard
                                    key={index}
                                    row={row}
                                    index={index}
                                    activeRfqPictures={activeRfq?.pictures}
                                    t={t}
                                    fieldSx={fieldSx}
                                    showItemErrors={showItemErrors}
                                    itemErrors={itemErrors}
                                    onUpdateItem={updateItem}
                                    onUploadImage={handleUploadImage}
                                    onRemoveImage={removeImage}
                                    onSelectRfqPicture={handleSelectRfqPicture}
                                    onRemoveRow={removeRow}
                                />
                            );
                        })}
                    </Stack>
                ) : (
                    <Paper
                        elevation={0}
                        sx={{
                            border: '1px solid #D9DCE3',
                            borderRadius: '24px',
                            overflowX: 'auto',
                            backgroundColor: '#fff'
                        }}
                    >
                        <Table
                            sx={{
                                minWidth: 1100,
                                '& .MuiTableCell-root': {
                                    borderColor: '#E6EAF0',
                                    verticalAlign: 'middle'
                                }
                            }}
                        >
                            <TableHead>
                                <TableRow
                                    sx={{
                                        backgroundColor: '#F7F8FB',
                                        '& .MuiTableCell-root': {
                                            py: 2.25,
                                            fontSize: 16,
                                            borderBottom: '1px solid #D9DCE3'
                                        }
                                    }}
                                >
                                    <TableCell width={70} />
                                    <TableCell width={140} align="center">
                                        <Typography fontWeight={700}>รูปสินค้า</Typography>
                                    </TableCell>
                                    <TableCell sx={{ minWidth: 320 }}>
                                        <Typography fontWeight={700}>
                                            {t('documentManagement.quotation.itemSection.name')}
                                        </Typography>
                                    </TableCell>
                                    <TableCell width={160} align="center">
                                        <Typography fontWeight={700}>
                                            {t('documentManagement.quotation.itemSection.quantity')}
                                        </Typography>
                                    </TableCell>
                                    <TableCell width={180} align="center">
                                        <Typography fontWeight={700}>
                                            {t('documentManagement.quotation.itemSection.unitPrice')}
                                        </Typography>
                                    </TableCell>
                                    <TableCell width={180} align="center">
                                        <Typography fontWeight={700}>
                                            {t('documentManagement.quotation.itemSection.totalAmount')}
                                        </Typography>
                                    </TableCell>
                                    <TableCell width={70} />
                                </TableRow>
                            </TableHead>

                            <TableBody>
                                {formik.values.items.map((row, index) => {
                                    const itemErrors = getItemErrorState(index);
                                    const showItemErrors = formik.submitCount > 0;

                                    return (
                                    <TableRow
                                        key={index}
                                        sx={{
                                            '& .MuiTableCell-root': {
                                                py: 2,
                                                backgroundColor: '#fff'
                                            },
                                            '&:hover .delete-btn': {
                                                opacity: 1
                                            }
                                        }}
                                    >
                                        {/* Index */}
                                        <TableCell align="center">
                                            <Box
                                                sx={{
                                                    width: 34,
                                                    height: 34,
                                                    borderRadius: '10px',
                                                    backgroundColor: '#F1F4F9',
                                                    display: 'flex',
                                                    alignItems: 'center',
                                                    justifyContent: 'center',
                                                    fontWeight: 700,
                                                    color: '#3A4256',
                                                    mx: 'auto'
                                                }}
                                            >
                                                {index + 1}
                                            </Box>
                                        </TableCell>

                                        <TableCell align="center">
                                            <Stack spacing={1} alignItems="center">
                                                <Box
                                                    sx={{
                                                        width: 88,
                                                        height: 88,
                                                        border: '1px dashed #C8D0DB',
                                                        borderRadius: '14px',
                                                        overflow: 'hidden',
                                                        backgroundColor: '#FAFBFC',
                                                        display: 'flex',
                                                        alignItems: 'center',
                                                        justifyContent: 'center'
                                                    }}
                                                >
                                                    {row.imagePreview ? (
                                                        <Box
                                                            component="img"
                                                            src={row.imagePreview}
                                                            alt="product"
                                                            sx={{
                                                                width: '100%',
                                                                height: '100%',
                                                                objectFit: 'cover'
                                                            }}
                                                        />
                                                    ) : (
                                                        <Typography variant="caption" color="text.secondary" textAlign="center">
                                                            {t('documentManagement.quotation.itemSection.noImage')}
                                                        </Typography>
                                                    )}
                                                </Box>

                                                <Button
                                                    component="label"
                                                    variant="outlined"
                                                    size="small"
                                                    sx={{ borderRadius: '999px' }}
                                                >
                                                    {t('documentManagement.quotation.itemSection.uploadImage')}
                                                    <input
                                                        hidden
                                                        accept="image/*"
                                                        type="file"
                                                        onChange={(e) => {
                                                            const file = e.target.files?.[0];
                                                            handleUploadImage(index, file);
                                                        }}
                                                    />
                                                </Button>

                                                {row.imagePreview && (
                                                    <Button
                                                        color="error"
                                                        variant="outlined"
                                                        size="small"
                                                        sx={{ borderRadius: '999px' }}
                                                        onClick={() => removeImage(index)}
                                                    >
                                                        {t('documentManagement.quotation.itemSection.removeImage')}
                                                    </Button>
                                                )}
                                            </Stack>
                                        </TableCell>

                                        {/* Name */}
                                        <TableCell>
                                            <Stack spacing={1.25}>
                                                <TextField
                                                    fullWidth
                                                    required
                                                    label={t('documentManagement.quotation.itemSection.name')}
                                                    value={row.name}
                                                    onChange={(e) => updateItem(index, 'name', e.target.value)}
                                                    variant="outlined"
                                                    sx={fieldSx}
                                                    error={Boolean(showItemErrors && itemErrors.name)}
                                                    helperText={showItemErrors ? itemErrors.name : ''}
                                                />

                                                <TextField
                                                    fullWidth
                                                    label={t('documentManagement.quotation.itemSection.spec')}
                                                    multiline
                                                    minRows={2}
                                                    value={row.spec}
                                                    onChange={(e) => updateItem(index, 'spec', e.target.value)}
                                                    variant="outlined"
                                                    sx={{
                                                        '& .MuiOutlinedInput-root': {
                                                            borderRadius: '12px',
                                                            backgroundColor: '#fff'
                                                        },
                                                        '& .MuiInputBase-input': {
                                                            fontSize: 16
                                                        }
                                                    }}
                                                />

                                                {(activeRfq?.pictures || []).length > 1 ? (
                                                    <Stack spacing={0.75}>
                                                        <Typography variant="caption" color="text.secondary">
                                                            {t('documentManagement.quotation.itemSection.image')}
                                                        </Typography>
                                                        <Stack
                                                            direction="row"
                                                            spacing={0.75}
                                                            sx={{
                                                                overflowX: 'auto',
                                                                pb: 0.5
                                                            }}
                                                        >
                                                            {(activeRfq?.pictures || []).map((picture, pictureIndex) => {
                                                                const isSelected = row.imagePreview === picture.pictureUrl;

                                                                return (
                                                                    <Box
                                                                        key={picture.id || picture.pictureUrl || pictureIndex}
                                                                        onClick={() => handleSelectRfqPicture(index, picture.pictureUrl)}
                                                                        sx={{
                                                                            width: 56,
                                                                            minWidth: 56,
                                                                            height: 56,
                                                                            borderRadius: '10px',
                                                                            overflow: 'hidden',
                                                                            cursor: 'pointer',
                                                                            border: isSelected
                                                                                ? '2px solid #1F3F37'
                                                                                : '1px solid #C8D0DB',
                                                                            boxShadow: isSelected
                                                                                ? '0 0 0 2px rgba(31, 63, 55, 0.16)'
                                                                                : 'none',
                                                                            opacity: isSelected ? 1 : 0.82,
                                                                            transition: 'all 0.2s ease',
                                                                            flexShrink: 0
                                                                        }}
                                                                    >
                                                                        <Box
                                                                            component="img"
                                                                            src={picture.pictureUrl}
                                                                            alt={`rfq-picture-${pictureIndex + 1}`}
                                                                            sx={{
                                                                                width: '100%',
                                                                                height: '100%',
                                                                                objectFit: 'cover',
                                                                                display: 'block'
                                                                            }}
                                                                        />
                                                                    </Box>
                                                                );
                                                            })}
                                                        </Stack>
                                                    </Stack>
                                                ) : null}
                                            </Stack>
                                        </TableCell>

                                        {/* Quantity */}
                                        <TableCell align="center">
                                                <TextField
                                                    fullWidth
                                                    type="text"
                                                    inputMode="decimal"
                                                    value={row.quantity}
                                                onChange={(e) =>
                                                    updateItem(index, 'quantity', Number(e.target.value || 0))
                                                }
                                                inputProps={{
                                                    min: 0,
                                                    style: { textAlign: 'center' }
                                                }}
                                                variant="outlined"
                                                    sx={{
                                                        maxWidth: 130,
                                                        mx: 'auto',
                                                        '& .MuiOutlinedInput-root': {
                                                            borderRadius: '12px',
                                                        minHeight: 54,
                                                        backgroundColor: '#fff'
                                                    },
                                                        '& .MuiInputBase-input': {
                                                            fontSize: 16,
                                                            fontWeight: 500
                                                        }
                                                    }}
                                                    error={Boolean(showItemErrors && itemErrors.quantity)}
                                                    helperText={showItemErrors ? itemErrors.quantity : ''}
                                                />
                                        </TableCell>

                                        {/* Unit Price */}
                                        <TableCell align="center">
                                                <TextField
                                                    fullWidth
                                                    type="text"
                                                    inputMode="decimal"
                                                    value={row.unitPrice}
                                                onChange={(e) => updateItem(index, 'unitPrice', e.target.value)}
                                                variant="outlined"
                                                    sx={{
                                                        maxWidth: 155,
                                                        mx: 'auto',
                                                        '& .MuiOutlinedInput-root': {
                                                            borderRadius: '12px',
                                                        minHeight: 54,
                                                        backgroundColor: '#fff'
                                                    },
                                                        '& .MuiInputBase-input': {
                                                            fontSize: 16,
                                                            fontWeight: 500,
                                                            textAlign: 'right'
                                                        }
                                                    }}
                                                    error={Boolean(showItemErrors && itemErrors.unitPrice)}
                                                    helperText={showItemErrors ? itemErrors.unitPrice : ''}
                                                />
                                        </TableCell>

                                        {/* Amount */}
                                        <TableCell align="center">
                                            <Box
                                                sx={{
                                                    minHeight: 54,
                                                    display: 'flex',
                                                    alignItems: 'center',
                                                    justifyContent: 'flex-end',
                                                    px: 1.5
                                                }}
                                            >
                                                <Typography
                                                    fontWeight={700}
                                                    sx={{
                                                        fontSize: 20,
                                                        color: '#2F3447'
                                                    }}
                                                >
                                                    {formatNumber(row.amount)}
                                                </Typography>
                                            </Box>
                                        </TableCell>

                                        {/* Delete */}
                                        <TableCell align="center">
                                            <IconButton
                                                className="delete-btn"
                                                onClick={() => removeRow(index)}
                                                sx={{
                                                    opacity: 0.7,
                                                    transition: '0.2s',
                                                    borderRadius: '12px',
                                                    '&:hover': {
                                                        backgroundColor: '#FFF1F1'
                                                    }
                                                }}
                                            >
                                                <DeleteOutline sx={{ color: '#B0B7C3' }} />
                                            </IconButton>
                                        </TableCell>
                                    </TableRow>
                                    );
                                })}
                            </TableBody>
                        </Table>
                    </Paper>
                )}

                <Stack
                    direction={{ xs: 'column', sm: 'row' }}
                    spacing={2}
                    sx={{ mt: 2.5 }}
                >
                    <Button
                        variant="outlined"
                        startIcon={<Add />}
                        onClick={addNewRow}
                        sx={{
                            borderRadius: '999px',
                            px: 3,
                            py: 1.25,
                            fontWeight: 700,
                            minHeight: 48
                        }}
                    >
                        {t('documentManagement.quotation.itemSection.addItem') || 'เพิ่มรายการใหม่'}
                    </Button>
                </Stack>
            </CollapsibleWrapper>
            <CollapsibleWrapper
                title={t('documentManagement.quotation.summarySection.title')}
                defaultExpanded={true}
            >
                <Grid container spacing={1}>
                    <Grid item xs={12} md={7}>
                        <TextField
                            type="text"
                            label={t('documentManagement.quotation.remark')}
                            fullWidth
                            multiline
                            rows={6}
                            variant="outlined"
                            value={formik.values.remark}
                            InputLabelProps={{ shrink: true }}
                            onChange={(event) => {
                                formik.setFieldValue('remark', event.target.value);
                            }}
                        />
                    </Grid>

                    {formik.values.isShowSummary ? (<Grid item xs={12} md={5}>
                        <Paper
                            elevation={0}
                            sx={{
                                border: '1px solid #E6EAF0',
                                borderRadius: '18px',
                                p: 2.5,
                                backgroundColor: '#FAFBFC'
                            }}
                        >
                            <Stack spacing={2}>
                                {/* Subtotal */}
                                <Stack direction="row" justifyContent="space-between" alignItems="center">
                                    <Typography fontWeight={500}>
                                        {t('documentManagement.quotation.summarySection.subtotal')}
                                    </Typography>
                                    <Typography fontWeight={600}>
                                        {formatCurrency(subTotal)}
                                    </Typography>
                                </Stack>

                                {/* Discount */}
                                <Stack direction="row" justifyContent="space-between" alignItems="center" spacing={2}>
                                    <Typography fontWeight={500} sx={{ minWidth: 120 }}>
                                        {t('documentManagement.quotation.summarySection.discount')}
                                    </Typography>

                                    <TextField
                                        type="number"
                                        value={formik.values.discount}
                                        onChange={(e) =>
                                            formik.setFieldValue('discount', Number(e.target.value || 0))
                                        }
                                        inputProps={{
                                            min: 0,
                                            style: { textAlign: 'right' }
                                        }}
                                        sx={{
                                            maxWidth: 180,
                                            '& .MuiOutlinedInput-root': {
                                                borderRadius: '12px',
                                                backgroundColor: '#fff'
                                            }
                                        }}
                                    />
                                </Stack>

                                {/* VAT */}
                                <Stack direction="row" justifyContent="space-between" alignItems="center">
                                    <Typography fontWeight={500}>
                                        {t('documentManagement.quotation.summarySection.vat')}
                                        {formik.values.isVat ? ' (7%)' : ''}
                                    </Typography>
                                    <Typography fontWeight={600}>
                                        {formatCurrency(vatAmount)}
                                    </Typography>
                                </Stack>

                                {/* Freight */}
                                {/* <Stack direction="row" justifyContent="space-between" alignItems="center" spacing={2}>
                                    <Typography fontWeight={500} sx={{ minWidth: 120 }}>
                                        {t('documentManagement.quotation.summarySection.freight')}
                                    </Typography>

                                    <TextField
                                        type="number"
                                        value={formik.values.freight}
                                        onChange={(e) =>
                                            formik.setFieldValue('freight', Number(e.target.value || 0))
                                        }
                                        inputProps={{
                                            min: 0,
                                            style: { textAlign: 'right' }
                                        }}
                                        sx={{
                                            maxWidth: 180,
                                            '& .MuiOutlinedInput-root': {
                                                borderRadius: '12px',
                                                backgroundColor: '#fff'
                                            }
                                        }}
                                    />
                                </Stack> */}

                                <Divider />

                                {/* Grand Total */}
                                <Stack direction="row" justifyContent="space-between" alignItems="center">
                                    <Typography variant="h6" fontWeight={700}>
                                        {t('documentManagement.quotation.summarySection.grandTotal')}
                                    </Typography>
                                    <Typography
                                        variant="h5"
                                        fontWeight={800}
                                        sx={{ color: '#1B5E20' }}
                                    >
                                        {formatCurrency(grandTotal)}
                                    </Typography>
                                </Stack>
                            </Stack>
                        </Paper>
                    </Grid>) : null}


                </Grid>
            </CollapsibleWrapper>
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
                        onClick={() => {
                            setTitle(t('general.confirmCloseTitle'));
                            setMsg(t('general.confirmCloseMsg'));
                            setAction('back');
                            setVisibleConfirmationDialog(true);
                        }}
                        variant="contained"
                        startIcon={<ArrowBack />}
                        className="btn-cool-grey">
                        {t('button.back')}
                    </Button>
                    <Button
                        fullWidth={isDownSm}
                        onClick={() => {

                        }}
                        startIcon={<Save />}
                        variant="contained"
                        className="btn-baby-blue"
                    >
                        {t('button.saveDraft')}
                    </Button>
                    <Button
                        fullWidth={isDownSm}
                        disabled={formik.isSubmitting || isLoading}
                        onClick={() => {
                            setAction('create');
                            setTitle(t('documentManagement.message.confirmCreateQuotationTitle'));
                            setMsg(t('documentManagement.message.confirmCreateQuotationMsg'));
                            setVisibleConfirmationDialog(true);
                        }}
                        startIcon={<Save />}
                        variant="contained"
                        className="btn-emerald-green">
                        {t('documentManagement.quotation.newQuotationButton')}
                    </Button>
                </Stack>
            </Wrapper>
            <SearchCustomerDialog
                open={openSearchCustomerAndDocDialog}
                onClose={() => {
                    history.push(ROUTE_PATHS.ROOT);
                    setOpenSearchCustomerAndDocDialog(false)
                }}
                onSelect={(payload) => {
                    setCustomer(payload.customer);
                    formik.setValues({
                        ...formik.values,
                        salesId: payload.customer.salesAccounts?.[0] || payload.customer.salesAccount,
                        customerId: payload.customer.id,
                        remark: buildPaymentTermRemark(payload.customer.customerPaymentTerm),
                        docDate: today,
                        effectiveDate: quotationDefaultEffectiveDate
                    });
                    if (payload.customer?.addresses?.length) {
                        const defaultAddress =
                            payload.customer.addresses.find((addr) => addr.isDefault) ||
                            payload.customer.addresses[0];

                        if (defaultAddress?.id && !formik.values.customerAddressId) {
                            formik.setFieldValue("customerAddressId", defaultAddress.id);
                        }
                    }
                    if (payload.customer?.contacts?.length) {
                        const defaultContact =
                            payload.customer.contacts.find((contact) => contact.isDefault) ||
                            payload.customer.contacts[0];

                        if (defaultContact?.id && !formik.values.customerContactId) {
                            formik.setFieldValue("customerContactId", defaultContact.id);
                        }
                    }
                    setOpenSearchCustomerAndDocDialog(false);
                }}
                initialCustomer={customer}
            />
            <SearchRfqDialog
                open={openSearchRfqDialog}
                onClose={() => setOpenSearchRfqDialog(false)}
                customerId={customer?.id || ''}
                onSelect={handleSelectRfq}
            />
            <SearchFreelanceSalesDialog
                open={openSearchFreelanceSalesDialog}
                onClose={() => setOpenSearchFreelanceSalesDialog(false)}
                onAddNew={() => {
                    setOpenSearchFreelanceSalesDialog(false);
                    handleOpenCreateFreelanceSaleDialog();
                }}
                salesId={formik.values.salesId || ''}
                initialFreelanceSale={selectedFreelanceSale}
                onSelect={({ freelanceSale }) => {
                    formik.setFieldValue('coSaleId', freelanceSale.id || '');
                    formik.setFieldValue('coSaleMode', CO_SALE_MODE_FREELANCE);
                    setSelectedFreelanceSaleItem(freelanceSale);
                    setSelectedFreelanceSaleLabel(`${freelanceSale.id} - ${freelanceSale.name}`);
                    setOpenSearchFreelanceSalesDialog(false);
                }}
            />
            <Dialog
                open={isUpdateCustomerDialogOpen}
                onClose={() => {
                    setIsUpdateCustomerDialogOpen(false);
                    updateCustomerDialogFormik.resetForm();
                }}
                fullWidth
                maxWidth="md"
            >
                <DialogTitle>อัพเดตข้อมูลลูกค้า</DialogTitle>
                <DialogContent>
                    <Grid container spacing={2} sx={{ mt: 0.5 }}>
                        <Grid item xs={12} sm={6}>
                            <TextField
                                fullWidth
                                name="customerName"
                                label={t('customerManagement.column.name')}
                                value={updateCustomerDialogFormik.values.customerName}
                                onChange={updateCustomerDialogFormik.handleChange}
                                onBlur={updateCustomerDialogFormik.handleBlur}
                                error={Boolean(
                                    updateCustomerDialogFormik.touched.customerName &&
                                    updateCustomerDialogFormik.errors.customerName
                                )}
                                helperText={
                                    updateCustomerDialogFormik.touched.customerName &&
                                    updateCustomerDialogFormik.errors.customerName
                                }
                                InputLabelProps={{ shrink: true }}
                                sx={fieldSx}
                            />
                        </Grid>
                        <Grid item xs={12} sm={6}>
                            <TextField
                                fullWidth
                                name="email"
                                label={t('customerManagement.column.email')}
                                value={updateCustomerDialogFormik.values.email}
                                onChange={updateCustomerDialogFormik.handleChange}
                                onBlur={updateCustomerDialogFormik.handleBlur}
                                InputLabelProps={{ shrink: true }}
                                sx={fieldSx}
                            />
                        </Grid>
                        <Grid item xs={12} sm={4}>
                            <TextField
                                select
                                fullWidth
                                name="type"
                                label={t('customerManagement.column.type')}
                                value={updateCustomerDialogFormik.values.type}
                                onChange={updateCustomerDialogFormik.handleChange}
                                onBlur={updateCustomerDialogFormik.handleBlur}
                                error={Boolean(
                                    updateCustomerDialogFormik.touched.type &&
                                    updateCustomerDialogFormik.errors.type
                                )}
                                helperText={updateCustomerDialogFormik.touched.type && updateCustomerDialogFormik.errors.type}
                                InputLabelProps={{ shrink: true }}
                                sx={fieldSx}
                            >
                                {customerTypeList.map((option) => (
                                    <MenuItem key={option.code} value={option.code}>
                                        {getConfigLabel(option)}
                                    </MenuItem>
                                ))}
                            </TextField>
                        </Grid>
                        <Grid item xs={12} sm={4}>
                            <TextField
                                select
                                fullWidth
                                name="tier"
                                label={t('customerManagement.column.tier')}
                                value={updateCustomerDialogFormik.values.tier}
                                onChange={updateCustomerDialogFormik.handleChange}
                                onBlur={updateCustomerDialogFormik.handleBlur}
                                InputLabelProps={{ shrink: true }}
                                sx={fieldSx}
                            >
                                <MenuItem value="">{t('general.clearSelected')}</MenuItem>
                                {customerTierList.map((option) => (
                                    <MenuItem key={option.code} value={option.code}>
                                        {getConfigLabel(option)}
                                    </MenuItem>
                                ))}
                            </TextField>
                        </Grid>
                        <Grid item xs={12} sm={4}>
                            <TextField
                                select
                                fullWidth
                                name="segment"
                                label={t('customerManagement.column.segment')}
                                value={updateCustomerDialogFormik.values.segment}
                                onChange={updateCustomerDialogFormik.handleChange}
                                onBlur={updateCustomerDialogFormik.handleBlur}
                                InputLabelProps={{ shrink: true }}
                                sx={fieldSx}
                            >
                                <MenuItem value="">{t('general.clearSelected')}</MenuItem>
                                {customerSegmentList.map((option) => (
                                    <MenuItem key={option.code} value={option.code}>
                                        {getConfigLabel(option)}
                                    </MenuItem>
                                ))}
                            </TextField>
                        </Grid>
                        <Grid item xs={12} sm={6}>
                            <TextField
                                fullWidth
                                name="taxId"
                                label={t('customerManagement.column.taxId')}
                                value={updateCustomerDialogFormik.values.taxId}
                                onChange={updateCustomerDialogFormik.handleChange}
                                onBlur={updateCustomerDialogFormik.handleBlur}
                                InputLabelProps={{ shrink: true }}
                                sx={fieldSx}
                            />
                        </Grid>
                        <Grid item xs={12} sm={6}>
                            <TextField
                                fullWidth
                                name="companyName"
                                label={t('customerManagement.column.company.name')}
                                value={updateCustomerDialogFormik.values.companyName}
                                onChange={updateCustomerDialogFormik.handleChange}
                                onBlur={updateCustomerDialogFormik.handleBlur}
                                error={Boolean(
                                    updateCustomerDialogFormik.touched.companyName &&
                                    updateCustomerDialogFormik.errors.companyName
                                )}
                                helperText={
                                    updateCustomerDialogFormik.touched.companyName &&
                                    updateCustomerDialogFormik.errors.companyName
                                }
                                InputLabelProps={{ shrink: true }}
                                sx={fieldSx}
                            />
                        </Grid>
                        {updateCustomerDialogFormik.values.type === 'COMPANY' ? (
                            <>
                                <Grid item xs={12} sm={6}>
                                    <TextField
                                        fullWidth
                                        name="companyBranchCode"
                                        label={t('customerManagement.column.company.branchCode')}
                                        value={updateCustomerDialogFormik.values.companyBranchCode}
                                        onChange={updateCustomerDialogFormik.handleChange}
                                        onBlur={updateCustomerDialogFormik.handleBlur}
                                        error={Boolean(
                                            updateCustomerDialogFormik.touched.companyBranchCode &&
                                            updateCustomerDialogFormik.errors.companyBranchCode
                                        )}
                                        helperText={
                                            updateCustomerDialogFormik.touched.companyBranchCode &&
                                            updateCustomerDialogFormik.errors.companyBranchCode
                                        }
                                        InputLabelProps={{ shrink: true }}
                                        sx={fieldSx}
                                    />
                                </Grid>
                                <Grid item xs={12} sm={6}>
                                    <TextField
                                        fullWidth
                                        name="companyBranchName"
                                        label={t('customerManagement.column.company.branchName')}
                                        value={updateCustomerDialogFormik.values.companyBranchName}
                                        onChange={updateCustomerDialogFormik.handleChange}
                                        onBlur={updateCustomerDialogFormik.handleBlur}
                                        error={Boolean(
                                            updateCustomerDialogFormik.touched.companyBranchName &&
                                            updateCustomerDialogFormik.errors.companyBranchName
                                        )}
                                        helperText={
                                            updateCustomerDialogFormik.touched.companyBranchName &&
                                            updateCustomerDialogFormik.errors.companyBranchName
                                        }
                                        InputLabelProps={{ shrink: true }}
                                        sx={fieldSx}
                                    />
                                </Grid>
                            </>
                        ) : null}
                        <Grid item xs={12} sm={6}>
                            <TextField
                                select
                                fullWidth
                                name="creditTerm"
                                label={t('customerManagement.column.creditTerm')}
                                value={updateCustomerDialogFormik.values.creditTerm}
                                onChange={updateCustomerDialogFormik.handleChange}
                                onBlur={updateCustomerDialogFormik.handleBlur}
                                error={Boolean(
                                    updateCustomerDialogFormik.touched.creditTerm &&
                                    updateCustomerDialogFormik.errors.creditTerm
                                )}
                                helperText={
                                    updateCustomerDialogFormik.touched.creditTerm &&
                                    updateCustomerDialogFormik.errors.creditTerm
                                }
                                InputLabelProps={{ shrink: true }}
                                sx={fieldSx}
                            >
                                {customerCreditTermList.map((option) => (
                                    <MenuItem key={option.code} value={option.code}>
                                        {getConfigLabel(option)}
                                    </MenuItem>
                                ))}
                            </TextField>
                        </Grid>
                        <Grid item xs={12} sm={6}>
                            <TextField
                                select
                                fullWidth
                                name="paymentTerm"
                                label={t('customerManagement.column.paymentTerm')}
                                value={updateCustomerDialogFormik.values.paymentTerm}
                                onChange={updateCustomerDialogFormik.handleChange}
                                onBlur={updateCustomerDialogFormik.handleBlur}
                                error={Boolean(
                                    updateCustomerDialogFormik.touched.paymentTerm &&
                                    updateCustomerDialogFormik.errors.paymentTerm
                                )}
                                helperText={
                                    updateCustomerDialogFormik.touched.paymentTerm &&
                                    updateCustomerDialogFormik.errors.paymentTerm
                                }
                                InputLabelProps={{ shrink: true }}
                                sx={fieldSx}
                            >
                                {customerPaymentTermList.map((option) => (
                                    <MenuItem key={option.code} value={option.code}>
                                        {getConfigLabel(option)}
                                    </MenuItem>
                                ))}
                            </TextField>
                        </Grid>
                        <Grid item xs={12} sm={6}>
                            <TextField
                                select
                                fullWidth
                                name="billingCondition"
                                label={t('customerManagement.column.billingCondition')}
                                value={updateCustomerDialogFormik.values.billingCondition}
                                onChange={updateCustomerDialogFormik.handleChange}
                                onBlur={updateCustomerDialogFormik.handleBlur}
                                InputLabelProps={{ shrink: true }}
                                sx={fieldSx}
                            >
                                <MenuItem value="">{t('general.clearSelected')}</MenuItem>
                                {customerBillingConditionList.map((option) => (
                                    <MenuItem key={option.code} value={option.code}>
                                        {getConfigLabel(option)}
                                    </MenuItem>
                                ))}
                            </TextField>
                        </Grid>
                        <Grid item xs={12} sm={6}>
                            <TextField
                                select
                                fullWidth
                                name="paymentCycle"
                                label={t('customerManagement.column.paymentCycle')}
                                value={updateCustomerDialogFormik.values.paymentCycle}
                                onChange={updateCustomerDialogFormik.handleChange}
                                onBlur={updateCustomerDialogFormik.handleBlur}
                                InputLabelProps={{ shrink: true }}
                                sx={fieldSx}
                            >
                                <MenuItem value="">{t('general.clearSelected')}</MenuItem>
                                {customerPaymentCycleList.map((option) => (
                                    <MenuItem key={option.code} value={option.code}>
                                        {getConfigLabel(option)}
                                    </MenuItem>
                                ))}
                            </TextField>
                        </Grid>
                    </Grid>
                </DialogContent>
                <DialogActions sx={{ px: 3, pb: 3 }}>
                    <Button
                        variant="outlined"
                        onClick={() => {
                            setIsUpdateCustomerDialogOpen(false);
                            updateCustomerDialogFormik.resetForm();
                        }}
                    >
                        {t('button.cancel')}
                    </Button>
                    <Button
                        variant="contained"
                        onClick={() => updateCustomerDialogFormik.handleSubmit()}
                        disabled={updateCustomerDialogFormik.isSubmitting}
                    >
                        {t('button.save')}
                    </Button>
                </DialogActions>
            </Dialog>
            <ConfirmDialog
                open={visibleConfirmationDialog}
                title={title}
                message={msg}
                confirmText={t('button.confirm')}
                cancelText={t('button.cancel')}
                onConfirm={() => {
                    if (action === 'create') {
                        formik.handleSubmit();
                    } else if (action === 'clear') {
                        // handleClear();
                    } else if (action === 'back') {
                        history.push('/quotation-management')
                    }
                    setVisibleConfirmationDialog(false);
                }}
                onCancel={() => setVisibleConfirmationDialog(false)}
                isShowCancelButton={true}
                isShowConfirmButton={true}
            />
            <CreateFreelanceSaleDialog
                open={openCreateFreelanceSaleDialog}
                onClose={() => setOpenCreateFreelanceSaleDialog(false)}
                defaultSaleCoverage={formik.values.salesId || ''}
                customerLabel={customer?.customerName || ''}
                onCreated={(createdFreelanceSale) => {
                    formik.setFieldValue('coSaleId', createdFreelanceSale?.id || '');
                    formik.setFieldValue('coSaleMode', CO_SALE_MODE_FREELANCE);
                    setSelectedFreelanceSaleItem(createdFreelanceSale || null);
                    setSelectedFreelanceSaleLabel(
                        createdFreelanceSale ? `${createdFreelanceSale.id} - ${createdFreelanceSale.name}` : ''
                    );
                    setOpenCreateFreelanceSaleDialog(false);
                }}
            />
            <Dialog
                open={isAddCustomerAddressDialogOpen}
                onClose={() => setIsAddCustomerAddressDialogOpen(false)}
                fullWidth
                maxWidth="sm">
                <DialogTitle>{t('customerManagement.column.address.addNew')}</DialogTitle>
                <DialogContent>
                    <Grid container spacing={2} sx={{ mt: 0.5 }}>
                        <Grid item xs={12} sm={6}>
                            <TextField
                                name="addressType"
                                select
                                fullWidth
                                label={t('customerManagement.column.address.type')}
                                value={addressDialogFormik.values.addressType}
                                onChange={addressDialogFormik.handleChange}
                                onBlur={addressDialogFormik.handleBlur}
                                error={Boolean(
                                    addressDialogFormik.touched.addressType && addressDialogFormik.errors.addressType
                                )}
                                helperText={
                                    addressDialogFormik.touched.addressType && addressDialogFormik.errors.addressType
                                }
                                InputLabelProps={{ shrink: true }}>
                                <MenuItem value="BILLING">
                                    {t('customerManagement.column.addressType.billing')}
                                </MenuItem>
                                <MenuItem value="SHIPPING">
                                    {t('customerManagement.column.addressType.shipping')}
                                </MenuItem>
                                <MenuItem value="OTHER">
                                    {t('customerManagement.column.addressType.other')}
                                </MenuItem>
                            </TextField>
                        </Grid>
                        <Grid item xs={12} sm={6}>
                            <TextField
                                name="label"
                                type="text"
                                label={t('customerManagement.column.address.label')}
                                fullWidth
                                value={addressDialogFormik.values.label}
                                onChange={addressDialogFormik.handleChange}
                                onBlur={addressDialogFormik.handleBlur}
                                InputLabelProps={{ shrink: true }}
                            />
                        </Grid>
                        <Grid item xs={12}>
                            <TextField
                                name="addressLine1"
                                type="text"
                                label={t('customerManagement.column.address.addressLine1')}
                                fullWidth
                                required
                                value={addressDialogFormik.values.addressLine1}
                                onChange={addressDialogFormik.handleChange}
                                onBlur={addressDialogFormik.handleBlur}
                                error={Boolean(
                                    addressDialogFormik.touched.addressLine1 &&
                                    addressDialogFormik.errors.addressLine1
                                )}
                                helperText={
                                    addressDialogFormik.touched.addressLine1 &&
                                    addressDialogFormik.errors.addressLine1
                                }
                                InputLabelProps={{ shrink: true }}
                            />
                        </Grid>
                        <Grid item xs={12}>
                            <TextField
                                name="addressLine2"
                                type="text"
                                label={t('customerManagement.column.address.addressLine2')}
                                fullWidth
                                value={addressDialogFormik.values.addressLine2}
                                onChange={addressDialogFormik.handleChange}
                                onBlur={addressDialogFormik.handleBlur}
                                InputLabelProps={{ shrink: true }}
                            />
                        </Grid>
                        <Grid item xs={12} sm={6}>
                            <TextField
                                name="province"
                                select
                                fullWidth
                                label={t('customerManagement.column.address.province')}
                                value={addressDialogFormik.values.province}
                                onChange={(event) => {
                                    addressDialogFormik.setFieldValue('province', event.target.value);
                                    addressDialogFormik.setFieldValue('district', '');
                                    addressDialogFormik.setFieldValue('subdistrict', '');
                                    addressDialogFormik.setFieldValue('postcode', '');
                                }}
                                onBlur={addressDialogFormik.handleBlur}
                                error={Boolean(
                                    addressDialogFormik.touched.province && addressDialogFormik.errors.province
                                )}
                                helperText={
                                    addressDialogFormik.touched.province && addressDialogFormik.errors.province
                                }
                                InputLabelProps={{ shrink: true }}>
                                <MenuItem value="">{t('general.clearSelected')}</MenuItem>
                                {provinces.map((option: Province) => (
                                    <MenuItem key={option.id} value={option.id}>
                                        {option.nameTh}
                                    </MenuItem>
                                ))}
                            </TextField>
                        </Grid>
                        <Grid item xs={12} sm={6}>
                            <TextField
                                name="district"
                                select
                                fullWidth
                                label={t('customerManagement.column.address.amphure')}
                                value={addressDialogFormik.values.district}
                                onChange={(event) => {
                                    addressDialogFormik.setFieldValue('district', event.target.value);
                                    addressDialogFormik.setFieldValue('subdistrict', '');
                                    addressDialogFormik.setFieldValue('postcode', '');
                                }}
                                onBlur={addressDialogFormik.handleBlur}
                                error={Boolean(
                                    addressDialogFormik.touched.district && addressDialogFormik.errors.district
                                )}
                                helperText={
                                    addressDialogFormik.touched.district && addressDialogFormik.errors.district
                                }
                                InputLabelProps={{ shrink: true }}>
                                <MenuItem value="">{t('general.clearSelected')}</MenuItem>
                                {districts
                                    .filter((option: District) => option.provinceId === addressDialogFormik.values.province)
                                    .map((option: District) => (
                                        <MenuItem key={option.id} value={option.id}>
                                            {option.nameTh}
                                        </MenuItem>
                                    ))}
                            </TextField>
                        </Grid>
                        <Grid item xs={12} sm={6}>
                            <TextField
                                name="subdistrict"
                                select
                                fullWidth
                                label={t('customerManagement.column.address.tumbon')}
                                value={addressDialogFormik.values.subdistrict}
                                onChange={(event) => {
                                    const selected = subdistricts.find((item: SubDistrict) => item.id === event.target.value);
                                    addressDialogFormik.setFieldValue('subdistrict', selected?.id ?? '');
                                    addressDialogFormik.setFieldValue('postcode', selected?.zipCode ?? '');
                                }}
                                onBlur={addressDialogFormik.handleBlur}
                                error={Boolean(
                                    addressDialogFormik.touched.subdistrict &&
                                    addressDialogFormik.errors.subdistrict
                                )}
                                helperText={
                                    addressDialogFormik.touched.subdistrict &&
                                    addressDialogFormik.errors.subdistrict
                                }
                                InputLabelProps={{ shrink: true }}>
                                <MenuItem value="">{t('general.clearSelected')}</MenuItem>
                                {subdistricts
                                    .filter((option: SubDistrict) => option.districtId === addressDialogFormik.values.district)
                                    .map((option: SubDistrict) => (
                                        <MenuItem key={option.id} value={option.id}>
                                            {option.nameTh}
                                        </MenuItem>
                                    ))}
                            </TextField>
                        </Grid>
                        <Grid item xs={12} sm={6}>
                            <TextField
                                name="postcode"
                                type="text"
                                label={t('customerManagement.column.address.postalCode')}
                                fullWidth
                                disabled
                                value={addressDialogFormik.values.postcode}
                                InputLabelProps={{ shrink: true }}
                            />
                        </Grid>
                        <Grid item xs={12} sm={6}>
                            <TextField
                                name="country"
                                type="text"
                                label={t('customerManagement.column.address.country')}
                                fullWidth
                                value={addressDialogFormik.values.country}
                                onChange={addressDialogFormik.handleChange}
                                onBlur={addressDialogFormik.handleBlur}
                                error={Boolean(
                                    addressDialogFormik.touched.country && addressDialogFormik.errors.country
                                )}
                                helperText={
                                    addressDialogFormik.touched.country && addressDialogFormik.errors.country
                                }
                                InputLabelProps={{ shrink: true }}
                            />
                        </Grid>
                    </Grid>
                </DialogContent>
                <DialogActions sx={{ px: 3, pb: 3 }}>
                    <Button
                        variant="contained"
                        className="btn-crimson-red"
                        onClick={() => setIsAddCustomerAddressDialogOpen(false)}>
                        {t('button.cancel')}
                    </Button>
                    <Button
                        variant="contained"
                        className="btn-emerald-green"
                        onClick={handleConfirmAddCustomerAddress}>
                        {t('button.save')}
                    </Button>
                </DialogActions>
            </Dialog>
            <Dialog
                open={isAddCustomerContactDialogOpen}
                onClose={() => setIsAddCustomerContactDialogOpen(false)}
                fullWidth
                maxWidth="sm">
                <DialogTitle>{t('customerManagement.addContact')}</DialogTitle>
                <DialogContent>
                    <Grid container spacing={2} sx={{ mt: 0.5 }}>
                        <Grid item xs={12} sm={6}>
                            <TextField
                                name="contactName"
                                type="text"
                                label={t('customerManagement.column.contactName')}
                                fullWidth
                                value={contactDialogFormik.values.contactName}
                                onChange={contactDialogFormik.handleChange}
                                onBlur={contactDialogFormik.handleBlur}
                                error={Boolean(
                                    contactDialogFormik.touched.contactName &&
                                    contactDialogFormik.errors.contactName
                                )}
                                helperText={
                                    contactDialogFormik.touched.contactName &&
                                    contactDialogFormik.errors.contactName
                                }
                                InputLabelProps={{ shrink: true }}
                            />
                        </Grid>
                        <Grid item xs={12} sm={6}>
                            <TextField
                                name="contactNumber"
                                type="text"
                                label={t('customerManagement.column.contactNumber')}
                                fullWidth
                                value={contactDialogFormik.values.contactNumber}
                                onChange={contactDialogFormik.handleChange}
                                onBlur={contactDialogFormik.handleBlur}
                                error={Boolean(
                                    contactDialogFormik.touched.contactNumber &&
                                    contactDialogFormik.errors.contactNumber
                                )}
                                helperText={
                                    contactDialogFormik.touched.contactNumber &&
                                    contactDialogFormik.errors.contactNumber
                                }
                                InputLabelProps={{ shrink: true }}
                            />
                        </Grid>
                    </Grid>
                </DialogContent>
                <DialogActions sx={{ px: 3, pb: 3 }}>
                    <Button
                        variant="contained"
                        className="btn-crimson-red"
                        onClick={() => setIsAddCustomerContactDialogOpen(false)}>
                        {t('button.cancel')}
                    </Button>
                    <Button
                        variant="contained"
                        className="btn-emerald-green"
                        onClick={handleConfirmAddCustomerContact}
                        disabled={contactDialogFormik.isSubmitting}>
                        {t('button.save')}
                    </Button>
                </DialogActions>
            </Dialog>
            <LoadingDialog
                open={isLoading || isRFQFetching || addressDialogFormik.isSubmitting || contactDialogFormik.isSubmitting}
            />
        </Page >
    );
}

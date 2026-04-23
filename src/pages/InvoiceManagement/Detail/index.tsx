/* eslint-disable prettier/prettier */
import { Box, Button, Checkbox, Chip, FormControlLabel, FormGroup, Grid, IconButton, InputAdornment, MenuItem, Paper, Select, Stack, Table, TableBody, TableCell, TableContainer, TableHead, TableRow, TextField, Typography, useMediaQuery, useTheme } from '@mui/material';
import { makeStyles } from '@mui/styles';
import LoadingDialog from 'components/LoadingDialog';
import PageTitle from 'components/PageTitle';
import { GridTextField, Wrapper } from 'components/Styled';
import { Page } from 'layout/LayoutRoute';
import { useEffect, useMemo, useRef, useState } from 'react';
import { isMobileOnly } from 'react-device-detect';
import { useTranslation } from 'react-i18next';
import { useHistory, useLocation, useParams } from "react-router-dom";
import { Invoice } from 'services/Invoice/invoice-type';
import styled from 'styled-components';
import { downloadReceipt, updateSaleOrder, updateSaleOrderPackage } from 'services/SaleOrder/sale-order-api';
import { OrderPackage, SaleOrder, UpdateSaleOrderBilling, UpdateSaleOrderRequest } from 'services/SaleOrder/sale-order-type';
import { useFormik } from 'formik';
import * as Yup from 'yup';
import toast from 'react-hot-toast';
import { FreightPrice, GetFreightPriceRequest } from 'services/Freight/freight-type';
import { getFreightPrice } from 'services/Freight/freight-api';
import { updateCustomer } from 'services/Customer/customer-api';
import { Save, ArrowBack, Preview, Edit, LocalShipping, Delete, Check } from '@mui/icons-material';
import ConfirmDialog from 'components/ConfirmDialog';
import { completeInvoice, downloadInvoice, downloadReceiptList, getInvoice, updateInvoice, updateInvoiceBilling, viewInvoice } from 'services/Invoice/invoice-api';
import ViewInvoiceDialog from '../ViewInvoiceDialog';
import { useQuery } from 'react-query';
import { getProvince, getAmphure, getTumbon } from 'services/Address/address-api';
import DownloadPOButton from 'components/DownloadButton';
import { getSystemConfig } from 'services/Config/config-api';
import { GROUP_CODE } from 'services/Config/config-type';
import { ProductDto, SearchProductRequest } from 'services/Product/product-type';
import { searchProduct } from 'services/Product/product-api';
import { DownloadDocumentResponse, WITH_HOLDING_OPTIONS } from 'services/general-type';
import DatePicker from 'components/DatePicker';
import { base64ToBlob, DEFAULT_DATE_FORMAT, formatDateStringWithPattern, formatMoney, urlToFile } from 'utils';
import dayjs from 'dayjs';
import CustomerForm from 'components/CustomerForm';
import ViewOptionDialog from 'components/ViewOptionDialog';
import ThumbnailList from 'components/ThumbnailList';
import { ROUTE_PATHS } from 'routes';

const PACKAGE_NAME_MAP: Record<string, string> = {
    bigBox: "กล่อง ใหญ่",
    smallBox: "กล่อง เล็ก",
    softBox: "กล่องนิ่ม",
    bigFoamBox: "กล่องโฟม ใหญ่",
    smallFoamBox: "กล่องโฟม เล็ก",
    phalanBox: "กล่องฟาแลนด์"
};

const packageFields = [
    'bigBox',
    'smallBox',
    'softBox',
    'bigFoamBox',
    'smallFoamBox',
    'phalanBox'
] as const;

const NoArrowTextField = styled(TextField)({
    '& input::-webkit-outer-spin-button, & input::-webkit-inner-spin-button': {
        display: 'none',
    },
    '& input[type=number]': {
        MozAppearance: 'textfield',
    },
});

export interface InvoiceParam {
    id: string;
}

export default function NewInvoice() {
    const { t } = useTranslation();
    const history = useHistory();
    const location = useLocation<{ invoice?: Invoice }>();
    const invoice = location.state?.invoice;
    const params = useParams<InvoiceParam>();
    const theme = useTheme();
    const isDownSm = useMediaQuery(theme.breakpoints.down('sm'));
    const [openLoading, setOpenLoading] = useState(false);
    const [changeBox, setChangeBox] = useState(false);
    const [visibleConfirmationDialog, setVisibleConfirmationDialog] = useState(false);
    const [openViewDialog, setOpenViewDialog] = useState(false);
    const [openViewOptionDialog, setOpenViewOptionDialog] = useState(false);
    const [printOriginal, setPrintOriginal] = useState(true);
    const [printCopy, setPrintCopy] = useState(false);
    const [pdfUrl, setPdfUrl] = useState('');
    const [invNo, setInvNo] = useState('');
    const [title, setTitle] = useState<string>('')
    const [msg, setMsg] = useState<string>('')
    const [action, setAction] = useState<string>('')
    const [viewTitle, setViewTitle] = useState<string>('');
    const [viewType, setViewType] = useState<string>('');
    const [inputInvoiceHeader, setInputInvoiceHeader] = useState<string>();
    const prevInvoiceHeader = useRef(inputInvoiceHeader);
    const [po, setPo] = useState<SaleOrder>();
    const [selectedReceipts, setSelectedReceipts] = useState<string[]>([]);
    const [orderPackage, setOrderPackage] = useState<OrderPackage>();
    const [freights, setFreights] = useState<FreightPrice[]>([]);
    const [packages, setPackages] = useState<ProductDto[]>([]);
    const [editingQty, setEditingQty] = useState<{ [key: number]: boolean }>({});
    const [editingDiscount, setEditingDiscount] = useState(false);
    const [discountInput, setDiscountInput] = useState<string>('0');
    const [enableWithHoldingTax, setEnableWithHoldingTax] = useState(false);
    const [withHoldingPercent, setWithHoldingPercent] = useState<number>(3);
    const [apiSubtotal, setApiSubtotal] = useState<number | null>(null);
    const [apiDiscount, setApiDiscount] = useState<number | null>(null);
    const [isDirtyAmount, setIsDirtyAmount] = useState(false);
    const [packagedImageFiles, setPackagedImageFiles] = useState<File[]>([]);
    const packagedImageFileUrls = packagedImageFiles.map((file) => URL.createObjectURL(file));

    const useStyles = makeStyles({
        hideObject: {
            display: 'none'
        },
        noResultMessage: {
            textAlign: 'center',
            fontSize: '1.2em',
            fontWeight: 'bold'
        },
        datePickerFromTo: {
            '&& .MuiOutlinedInput-input': {
                padding: '16.5px 14px'
            },
            '&& .MuiFormLabel-root': {
                fontSize: '13px'
            }
        },
    });
    const classes = useStyles();
    const {
        data: invoiceData
    } = useQuery(['invoice', params.id], () => getInvoice(params.id), {
        refetchOnWindowFocus: false
    });

    const handlePackageChange = (fieldName: string, value?: number) => {
        const qty = Number(value || 0);

        formik.setFieldValue(fieldName, qty);

        const freight = freights.find(f => f.packages === fieldName);

        // ---------- CASE 1: ไม่ใช่ freight ----------
        if (!freight) {
            const thName = PACKAGE_NAME_MAP[fieldName];
            const packageValue = packages.find(p => p.productNameTh === thName);

            if (!packageValue) return;

            // 🧹 remove ก่อนเสมอ
            let updatedPoLines = formik.values.poLines.filter(
                pol => pol.itemName !== packageValue.productNameTh
            );

            // ➕ add เฉพาะ qty > 0
            if (qty > 0 && packageValue.wholesalePrice > 0) {
                updatedPoLines.push({
                    itemSku: packageValue.productSku,
                    itemName: packageValue.productNameTh,
                    qty,
                    status: 'COMPLETE',
                    salesPrice: packageValue.wholesalePrice,
                    no: 200,
                    itemImageUrl: undefined,
                    id: '',
                    orderId: '',
                    haveQty: 0,
                    orderQty: 0,
                    oldQty: [],
                    amount: 0,
                    statusDetail: '',
                    isFirstCheck: false,
                    isSecondCheck: false,
                    purchaseFrom: '',
                    remark: '',
                    isClaimed: false,
                    supplier: undefined,
                    createdDate: '',
                    createdBy: '',
                    updatedDate: '',
                    updatedBy: ''
                });
            }

            formik.setFieldValue('poLines', updatedPoLines);
            return;
        }

        // ---------- CASE 2: freight ----------
        const packagePoLine = {
            itemName: freight.packageName,
            itemSku: freight.packageProductSku,
            qty,
            status: 'COMPLETE',
            salesPrice: freight.packagePrice,
            isFirstCheck: true,
            isSecondCheck: true
        };

        const freightPoLine = {
            itemName: freight.freightName,
            itemSku: freight.freightProductSku,
            qty,
            status: 'COMPLETE',
            salesPrice: freight.freightPrice,
            isFirstCheck: true,
            isSecondCheck: true
        };

        // 🧹 remove package + freight เสมอ
        let updatedPoLines = formik.values.poLines.filter(
            pol =>
                pol.itemName !== freight.packageName &&
                pol.itemName !== freight.freightName
        );

        // ➕ add เฉพาะ qty > 0
        if (qty > 0) {
            if (packagePoLine.salesPrice > 0) {
                updatedPoLines.push(packagePoLine);
            }
            if (freightPoLine.salesPrice > 0) {
                updatedPoLines.push(freightPoLine);
            }
        }

        formik.setFieldValue('poLines', updatedPoLines);
    };

    const { data: provinces } = useQuery('province', () => getProvince(), {
        refetchOnWindowFocus: false
    });
    const { data: amphures } = useQuery('amphure', () => getAmphure(), {
        refetchOnWindowFocus: false
    });
    const { data: tumbons } = useQuery('tumbon', () => getTumbon(), { refetchOnWindowFocus: false });

    const completedInvoiceFunction = (id: string) => {
        if (!id) return;

        toast.promise(completeInvoice(id), {
            loading: t('toast.loading'),
            success: () => {
                history.push(ROUTE_PATHS.INVOICE_MANAGEMENT);
                return t('toast.success');
            },
            error: () => {
                return t('toast.failed');
            }
        });
    }

    const toggleEditQty = (idx: number) => {
        setEditingQty((prev) => ({ ...prev, [idx]: !prev[idx] }));
    };

    const downloadInvoiceFunction = (inv: any, opt: string, options: { original: boolean, copy: boolean }) => {
        toast.promise(downloadInvoice(inv.invoiceNo, opt, options.original, options.copy), {
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
                if (opt === 'PDF') {
                    const file = data.files[0];
                    const blob = base64ToBlob(file.base64, 'application/pdf');
                    const url = window.URL.createObjectURL(blob);

                    const link = document.createElement('a');
                    link.href = url;
                    link.download = file.fileName || `${po.invoiceNo}.pdf`;
                    link.click();

                    window.URL.revokeObjectURL(url);
                }

                // ================= JPG (หลายไฟล์) =================
                if (opt === 'JPG') {
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

    const downloadReceiptFunction = (po: SaleOrder, opt: string, options: { original: boolean, copy: boolean }) => {
        toast.promise(downloadReceipt(po.id, opt, options.original, options.copy), {
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
                if (opt === 'PDF') {
                    const file = data.files[0];
                    const blob = base64ToBlob(file.base64, 'application/pdf');
                    const url = window.URL.createObjectURL(blob);

                    const link = document.createElement('a');
                    link.href = url;
                    link.download = file.fileName || `${po.invoiceNo}.pdf`;
                    link.click();

                    window.URL.revokeObjectURL(url);
                }

                // ================= JPG (หลายไฟล์) =================
                if (opt === 'JPG') {
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

    const initialPackages = (po: SaleOrder, orderPackage: OrderPackage, packages: ProductDto[]) => {

        if (!orderPackage || !po) return;

        let updatedPoLines = po?.saleOrderLines.filter(pol => pol.status !== 'CANCEL');
        console.log('init package ', updatedPoLines)
        for (const field of packageFields) {
            const value = orderPackage[field];
            if (typeof value !== 'number' || value <= 0) continue;
            const thName = PACKAGE_NAME_MAP[field];
            const packageValue = packages.find(product => product.productNameTh === thName);

            if (!packageValue) continue;

            const alreadyExists = updatedPoLines?.some(
                pol => pol.itemSku === packageValue.productSku
            );

            if (!alreadyExists && packageValue.wholesalePrice > 0) {
                const packagePoLine = {
                    itemSku: packageValue.productSku,
                    itemName: packageValue.productNameTh,
                    qty: value,
                    status: 'COMPLETE',
                    salesPrice: packageValue.wholesalePrice,
                    no: 200,
                    isFirstCheck: true,
                    isSecondCheck: true,
                };

                updatedPoLines?.push(packagePoLine);
            }

            // update formik field เช่น bigBox / smallBox
            formik.setFieldValue(field, value);
        }

        // Set all poLines at once
        formik.setFieldValue('poLines', updatedPoLines);
    }

    const initialFreight = (po: SaleOrder, orderPackage: OrderPackage) => {
        if (!orderPackage || !po) return;
        let updatedPoLines = po.saleOrderLines.filter(pol => pol.status !== 'CANCEL');

        for (const field of packageFields) {
            const value = orderPackage[field];
            if (typeof value !== 'number' || value <= 0) continue;

            const freight = freights.find(f => f.packageName === field);
            if (!freight) continue;

            const freightPoLine = {
                itemSku: freight.freightProductSku,
                itemName: freight.freightName,
                qty: value,
                status: 'COMPLETE',
                salesPrice: freight.freightPrice,
                no: 200,
                isFirstCheck: true,
                isSecondCheck: true,
            };

            // Remove duplicates
            updatedPoLines = updatedPoLines.filter(
                pol => pol.itemName !== freight.packageName
            );

            // Add if price > 0
            if (freightPoLine.salesPrice > 0) updatedPoLines.push(freightPoLine);

            // Update field value like 'bigBox', 'smallBox', etc.
            formik.setFieldValue(field, value);
        }

        // Set all poLines at once
        formik.setFieldValue('poLines', updatedPoLines);
    }

    const initialValues = useMemo(
        () => ({
            customerId: invoiceData?.customer.customerId ?? '',
            customerName: invoiceData?.customer.customerName ?? '',
            displayName: invoiceData?.customer.displayName ?? '',
            customerAreaType: invoiceData?.customer.customerArea?.code ?? '',
            contactNumber1: invoiceData?.customer.contactNumber1 ?? '',
            contactNumber2: invoiceData?.customer.contactNumber2 ?? '',
            contactName: invoiceData?.customer.contactName ?? '',
            type: invoiceData?.customer.customerType?.code ?? 'INDIVIDUAL',
            taxId: invoiceData?.customer.taxId ?? '',
            companyName: invoiceData?.customer.companyName ?? '',
            companyBranchCode: invoiceData?.customer.branchNumber ?? '',
            companyBranchName: invoiceData?.customer.branchName ?? '',
            creditTerm: invoiceData?.customer.customerCreditTerm?.code ?? '',
            sendingBillMethod: invoiceData?.customer.sendingBillMethod ?? '',
            billingHeader: invoiceData?.customer.billingHeader ?? '',
            address: invoiceData?.customer.address ?? '',
            addressTumbon: invoiceData?.customer.addressTumbon?.id ?? '',
            addressAmphure: invoiceData?.customer.addressAmphure?.id ?? '',
            addressProvince: invoiceData?.customer.addressProvince?.id ?? '',
            postalCode: invoiceData?.customer.addressTumbon?.zipCode ?? ''
        }),
        [invoiceData?.customer]
    );


    const { data: customerTypeList, isFetching: isCustomerTypeFetching } = useQuery(
        'customer-type',
        () => getSystemConfig(GROUP_CODE.CUSTOMER_TYPE),
        {
            refetchOnWindowFocus: false
        }
    );

    const hasAddress = (v: unknown) => typeof v === 'string' && v.trim().length > 0;

    const requireIfAddress = (schema: Yup.StringSchema, msg: string) =>
        schema.when('address', {
            is: hasAddress,
            then: (s) => s.required(msg),
            otherwise: (s) => s.notRequired().nullable()
        });

    const customerFormik = useFormik({
        initialValues,
        enableReinitialize: true,
        validateOnMount: true,
        validationSchema: Yup.object().shape({
            customerName: Yup.string()
                .max(255)
                .required(t('customerManagement.message.validateCustomerName')),
            contactName: Yup.string()
                .max(255)
                .required(t('customerManagement.message.validateContactName')),
            contactNumber1: Yup.string()
                .max(255)
                .required(t('customerManagement.message.validateContactNumber')),
            taxId: Yup.string().required(t('customerManagement.message.validateTaxId')),
            address: Yup.string().trim().nullable(), // not required by itself
            addressProvince: requireIfAddress(
                Yup.string().trim().nullable(),
                t('supplierManagement.message.validateProvince')
            ),

            addressAmphure: requireIfAddress(
                Yup.string().trim().nullable(),
                t('supplierManagement.message.validateAmphure')
            ),

            addressTumbon: requireIfAddress(
                Yup.string().trim().nullable(),
                t('supplierManagement.message.validateTumbon')
            )
        }),
        onSubmit: async (values) => {
            toast.promise(updateCustomer(values.customerId, values), {
                loading: t('toast.loading'),
                success: t('toast.success'),
                error: t('toast.failed')
            });
        }
    });

    const createEmptyFreightLine = () => ({
        itemName: '',
        itemSku: '999999999999',
        qty: 1,
        salesPrice: null,
        status: 'COMPLETE',
        isFirstCheck: true,
        isSecondCheck: true,
        isManual: true
    });

    const isHeadOffice = customerFormik.values.companyBranchCode === '00000';

    const handleHeadOfficeToggle = (checked: boolean) => {
        if (checked) {
            customerFormik.setFieldValue('companyBranchCode', '00000');
            customerFormik.setFieldValue('companyBranchName', 'สำนักงานใหญ่');
        } else {
            customerFormik.setFieldValue('companyBranchCode', '');
            customerFormik.setFieldValue('companyBranchName', '');
        }
    };
    const today = dayjs();
    const formik = useFormik({
        initialValues: {
            poId: po ? po.id : '',
            invoiceId: invoiceData ? invoiceData.invoiceNo : '',
            invoiceDate: '',
            dueDate: '',
            bigBox: orderPackage?.bigBox,
            smallBox: orderPackage?.smallBox,
            softBox: orderPackage?.softBox,
            bigFoamBox: orderPackage?.bigFoamBox,
            smallFoamBox: orderPackage?.smallFoamBox,
            phalanBox: orderPackage?.phalanBox,
            wrap: orderPackage?.wrap,
            oasis: orderPackage?.oasis,
            bag: orderPackage?.bag,
            other: orderPackage?.other,
            poLines: po ? po.saleOrderLines.filter(pol => pol.status !== 'CANCEL') : [],
        },
        validationSchema: Yup.object().shape({
            poId: Yup.string().required(),
            poLines: Yup.array().of(
                Yup.object().shape({
                    salesPrice: Yup.number()
                        .typeError('Sale price must be a number')
                        .when('isClaimed', {
                            is: false,
                            then: (schema) =>
                                schema
                                    .required('Sale price is required')
                                    .moreThan(0, 'Sale price must be greater than 0'),
                            otherwise: (schema) => schema.notRequired(),
                        }),
                })
            )
        }),
        enableReinitialize: true,
        onSubmit: async (values, actions) => {
            actions.setSubmitting(true);
            if (changeBox) {
                const orderPackage: OrderPackage = {
                    bigBox: values.bigBox,
                    smallBox: values.smallBox,
                    softBox: values.softBox,
                    bigFoamBox: values.bigFoamBox,
                    smallFoamBox: values.smallFoamBox,
                    wrap: values.wrap,
                    oasis: values.oasis,
                    bag: values.bag,
                    other: values.other,
                    packedStaff: [],
                    phalanBox: undefined
                };
                await toast.promise(updateSaleOrderPackage(values.poId, orderPackage), {
                    loading: t('toast.loading'),
                    success: () => {
                        return t('toast.success');
                    },
                    error: () => {
                        return t('toast.failed');
                    }
                });
            }

            const updateReq: UpdateSaleOrderBilling = {
                poLines: values.poLines,
                discount: discount,
                withholdingTax: enableWithHoldingTax ? withHoldingPercent : 0,
                dueDate: values.dueDate
            }

            await toast.promise(updateInvoiceBilling(values.invoiceId, updateReq), {
                loading: t('toast.loading'),
                success: () => {
                    return t('toast.success');
                },
                error: () => {
                    return t('toast.failed');
                }
            });

            if (prevInvoiceHeader.current !== inputInvoiceHeader) {
                const updateReq = {
                    invoiceHeader: inputInvoiceHeader
                }
                updateInvoice(values.invoiceId, updateReq)
            }
        }
    });

    const handleAddFreightLine = () => {
        const newLine = createEmptyFreightLine();

        formik.setFieldValue('poLines', [
            ...formik.values.poLines,
            newLine
        ]);

        // เปิด edit qty ของแถวใหม่อัตโนมัติ (optional)
        setEditingQty(prev => ({
            ...prev,
            [formik.values.poLines.length]: true
        }));
    };

    const handleRemoveLine = (index: number) => {
        const newLines = formik.values.poLines.filter((_, i) => i !== index);
        formik.setFieldValue('poLines', newLines);

        // ลบ state edit ด้วย (กัน bug)
        setEditingQty(prev => {
            const copy = { ...prev };
            delete copy[index];
            return copy;
        });
    };

    const viewInvoiceFunction = (inv: any, options: { original: boolean, copy: boolean }) => {
        toast.promise(viewInvoice(inv.invoiceNo, options.original, options.copy), {
            loading: t('toast.loading'),
            success: (response) => {
                const data = response.data as DownloadDocumentResponse;

                if (!data.files?.length) {
                    throw new Error('No file');
                }

                const file = data.files[0]; // PDF มีไฟล์เดียว

                const blob = base64ToBlob(file.base64, file.contentType);
                const url = URL.createObjectURL(blob);

                setInvNo(inv.invoiceNo);
                setPdfUrl(url);
                setOpenViewDialog(true);
                return t('toast.success');
            },
            error: () => {
                return t('toast.failed');
            }
        });
    };

    const viewReceiptListFunction = (id: string, receiptNos: string[], options: { original: boolean; copy: boolean }) => {
        setOpenLoading(true);
        toast.promise(downloadReceiptList(id, receiptNos, options.original, options.copy), {
            loading: t('toast.loading'),
            success: (response) => {
                const data = response.data as {
                    format: 'PDF' | 'JPG';
                    files: {
                        fileName: string;
                        base64: string;
                    }[];
                };

                const file = data.files[0];
                const blob = base64ToBlob(file.base64, 'application/pdf');
                const url = window.URL.createObjectURL(blob);

                const link = document.createElement('a');
                link.href = url;
                link.download = file.fileName;
                link.click();

                window.URL.revokeObjectURL(url);

                return t('toast.success');
            },
            error: (error) => {
                console.log(error)
                return t('toast.failed');
            }
        }).finally(() => {
            setOpenLoading(false);
        });
    };

    function getSalePriceError(index: number): string {
        const touched = formik.touched.poLines?.[index]?.salesPrice;
        const error = formik.errors.poLines?.[index]?.salesPrice;
        return touched && error ? String(error) : '';
    }

    const handleToggleReceipt = (receiptNo: string) => {
        setSelectedReceipts(prev =>
            prev.includes(receiptNo)
                ? prev.filter(r => r !== receiptNo)
                : [...prev, receiptNo]
        );
    };

    // const [discount, setDiscount] = useState<number>(0);

    const memoSubtotal = useMemo(() => {
        return formik.values.poLines.reduce((sum, line) => {
            return sum + line.qty * line.salesPrice;
        }, 0);
    }, [formik.values.poLines]);

    const memoDiscount = useMemo(() => {
        return Number(discountInput) || 0;
    }, [discountInput]);

    const subtotal = isDirtyAmount ? memoSubtotal : apiSubtotal ?? memoSubtotal;
    const discount = isDirtyAmount ? memoDiscount : apiDiscount ?? memoDiscount;
    const netAmount = subtotal - discount;
    const grandTotal = netAmount;

    const memoWhtAmount = useMemo(() => {
        if (!enableWithHoldingTax) return 0;
        return Math.round((netAmount * withHoldingPercent) / 100 * 100) / 100;
    }, [netAmount, withHoldingPercent, enableWithHoldingTax]);
    const withHoldingAmount = memoWhtAmount;

    const payAmount = useMemo(() => {
        return grandTotal - (enableWithHoldingTax ? withHoldingAmount : 0);
    }, [grandTotal, withHoldingAmount, enableWithHoldingTax]);

    const hasAtLeastOnePackage = useMemo(() => {
        return packageFields.some(
            field => Number(formik.values[field]) > 0
        );
    }, [formik.values]);

    const isAllPoLinesValid = useMemo(() => {
        if (!formik.values.poLines || formik.values.poLines.length === 0) return false;

        return formik.values.poLines
            .filter(line => !line.isClaimed)
            .every(line =>
                Number(line.qty) > 0 &&
                Number(line.salesPrice) > 0
            );
    }, [formik.values.poLines]);

    const canFinish = useMemo(() => {
        console.log('hasAtLeastOnePackage:', hasAtLeastOnePackage);
        console.log('isAllPoLinesValid:', isAllPoLinesValid);
        return hasAtLeastOnePackage && isAllPoLinesValid;
    }, [hasAtLeastOnePackage, isAllPoLinesValid]);

    const sortedPoLines = [...formik.values.poLines].sort(
        (a, b) => a.no - b.no
    );

    useEffect(() => {
        setOpenLoading(true);
        if (invoiceData !== undefined) {
            setPo(invoiceData?.saleOrder);
            prevInvoiceHeader.current = invoiceData.invoiceHeader;
            setInputInvoiceHeader(invoiceData.invoiceHeader);
            setOpenLoading(false);
        }

    }, [invoiceData]);

    useEffect(() => {
        (async () => {
            if (!po) return;

            setOpenLoading(true);
            const op = po.totalPackage;
            setOrderPackage(op);

            if (po?.dropOff?.shippingMethod?.code === 'DELIVERY') {
                const req: GetFreightPriceRequest = {
                    provinceId: po.dropOff.province?.id,
                    amphureId: po.dropOff.amphure?.id,
                    supplierId: po.dropOff.supplier?.supplierId
                };
                const freightData = await getFreightPrice(req);
                setFreights(freightData.data);
            }

            const packageReq: SearchProductRequest = {
                nameContain: '',
                skuContain: '',
                categoryEqual: '',
                groupEqual: '',
                subGroupEqual: '',
                parentSkuEqual: '',
                isIncludeParentSku: true,
                categoryIn: [],
                groupIn: [],
                subGroupIn: ['กล่องกระดาษ', 'กล่องโฟม', 'กล่องนิ่ม', 'กล่องฟาแลนด์']
            };
            const packageData = await searchProduct(packageReq, 1, 100);

            if (op) {
                initialFreight(po, op);
                initialPackages(po, op, packageData.data.products);
                setPackages(packageData.data.products);
            }

            setOpenLoading(false);
            setChangeBox(false);

            if (po.subtotal != null) {
                setApiSubtotal(po.subtotal);
            }

            const discount = po.discount ?? 0;
            const creditBalance = po.customer?.creditBalance ?? 0;

            const totalDiscount =
                creditBalance > 0
                    ? discount + creditBalance
                    : discount;

            setApiDiscount(totalDiscount);
            setDiscountInput(String(totalDiscount));

            if (po.withholdingTax != null) {
                setWithHoldingPercent(po.withholdingTax);
                if (po.withholdingTax === 0) {
                    setEnableWithHoldingTax(false);
                } else {
                    setEnableWithHoldingTax(true);
                }
            }

            if (po.invoiceDate != null) {
                formik.setFieldValue('invoiceDate', dayjs(po.invoiceDate))
            }
            if (po.dueDate != null) {
                formik.setFieldValue('dueDate', dayjs(po.dueDate));
            } else {
                formik.setFieldValue('dueDate', dayjs());
            }

            const convertToFiles = async () => {
                const packedFiles = await Promise.all(
                    (po?.packagePics || [])
                        .filter((pic) => pic.picUrl.includes('_package_'))
                        .map((pic) => urlToFile(pic.picUrl, `${pic.picId}`))
                );
                setPackagedImageFiles(packedFiles);
            };

            convertToFiles();
        })();
    }, [po]);

    useEffect(() => {
        return () => {
            if (pdfUrl) {
                window.URL.revokeObjectURL(pdfUrl);
            }
        };
    }, [pdfUrl]);

    useEffect(() => {
        setIsDirtyAmount(true);
    }, [formik.values.poLines]);

    return (
        <Page>
            <PageTitle title={t('invoiceManagement.create.title', { po: invoice?.poId })} manualId="MANUAL000011" />
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
                            setTitle(t('message.confirmCloseTitle'));
                            setMsg(t('message.confirmCloseMsg'));
                            setAction('CLOSE');
                            setVisibleConfirmationDialog(true);
                        }}
                        variant="contained"
                        startIcon={<ArrowBack />}
                        className="btn-cool-grey">
                        {t('button.back')}
                    </Button>
                    <Button
                        fullWidth={isDownSm}
                        disabled={invoiceData?.paymentStatus === 'PAID' || invoiceData?.paymentStatus === 'OVERPAID'}
                        onClick={() => {
                            setTitle(t('message.confirmUpdateBillingTitle', { poId: po?.id }));
                            setMsg(t('message.confirmUpdateBillingMsg'));
                            setAction('SUBMIT');
                            setVisibleConfirmationDialog(true);
                        }}
                        variant="contained"
                        startIcon={<Save />}
                        className="btn-emerald-green"
                    >
                        {t('button.save')}
                    </Button>
                    <Button
                        fullWidth={isDownSm}
                        onClick={() => {
                            setViewTitle(t('invoiceManagement.invoiceNoTitle'));
                            setViewType('INVOICE');
                            setOpenViewOptionDialog(true);
                        }}
                        variant="contained"
                        startIcon={<Preview />}
                        className="btn-green-teal">
                        {t('invoiceManagement.viewInvoice')}
                    </Button>
                    <DownloadPOButton
                        po={invoiceData}
                        className='btn-baby-blue'
                        isDownSm={isDownSm}
                        label={t('invoiceManagement.downloadInvoice')}
                        downloadSaleOrderFunction={(invoiceData, format, options) => {
                            downloadInvoiceFunction(invoiceData, format, options);
                        }}
                    />

                    {invoiceData?.paymentStatus !== 'UNPAID' && (
                        <Button
                            fullWidth={isDownSm}
                            onClick={() => {
                                setViewTitle(t('billingManagement.viewBillingReceiptTitle'));
                                setViewType('RECEIPT');
                                setOpenViewOptionDialog(true);
                            }}
                            variant="contained"
                            startIcon={<Preview />}
                            className='btn-pastel-yellow'>
                            {t('invoiceManagement.createReceipt')}
                        </Button>
                    )}
                </Stack>
            </Wrapper>
            <Wrapper>
                <CustomerForm
                    customerFormik={customerFormik}
                    isDownSm={isDownSm}
                    customerTypeList={customerTypeList}
                    provinces={provinces}
                    amphures={amphures}
                    tumbons={tumbons}
                    isHeadOffice={isHeadOffice}
                    onToggleHeadOffice={handleHeadOfficeToggle}
                    onSubmitClick={() => {
                        setTitle(t('message.confirmUpdateCustomerTitle'));
                        setMsg(t('message.confirmUpdateCustomerMsg'));
                        setAction('UPDATE_CUSTOMER');
                        setVisibleConfirmationDialog(true);
                    }}
                />
            </Wrapper>
            <Wrapper>
                <Grid container spacing={1}>
                    <GridTextField item xs={12} sm={4}>
                        <Typography variant="subtitle1" fontWeight={600}>{t('purchaseOrder.updateBoxSection.title')}</Typography>
                    </GridTextField>
                </Grid>
                <Grid container spacing={1}>
                    <GridTextField item xs={6} sm={4}>
                        <NoArrowTextField
                            type="number"
                            label={t('purchaseOrder.updateBoxSection.bigBox')}
                            fullWidth
                            variant="outlined"
                            value={formik.values.bigBox === 0 ? '' : formik.values.bigBox}
                            onChange={({ target }) => {
                                setChangeBox(true);
                                handlePackageChange('bigBox', target.value);
                            }}
                            InputLabelProps={{ shrink: true }}
                            inputProps={{
                                inputMode: 'numeric',
                                pattern: '[0-9]*',
                                min: 1
                            }}
                        />
                    </GridTextField>
                    <GridTextField item xs={6} sm={4}>
                        <NoArrowTextField
                            type="number"
                            label={t('purchaseOrder.updateBoxSection.smallBox')}
                            fullWidth
                            variant="outlined"
                            value={formik.values.smallBox === 0 ? '' : formik.values.smallBox}
                            onChange={({ target }) => {
                                setChangeBox(true);
                                handlePackageChange('smallBox', target.value);
                            }}
                            InputLabelProps={{ shrink: true }}
                            inputProps={{
                                inputMode: 'numeric',
                                pattern: '[0-9]*',
                                min: 1
                            }}
                        />
                    </GridTextField>
                    <GridTextField item xs={6} sm={4}>
                        <NoArrowTextField
                            type="number"
                            label={t('purchaseOrder.updateBoxSection.softBox')}
                            fullWidth
                            variant="outlined"
                            value={formik.values.softBox === 0 ? '' : formik.values.softBox}
                            onChange={({ target }) => {
                                setChangeBox(true);
                                handlePackageChange('softBox', target.value);
                            }}
                            InputLabelProps={{ shrink: true }}
                            inputProps={{
                                inputMode: 'numeric',
                                pattern: '[0-9]*',
                                min: 1
                            }}
                        />
                    </GridTextField>
                    <GridTextField item xs={6} sm={4}>
                        <NoArrowTextField
                            type="number"
                            label={t('purchaseOrder.updateBoxSection.bigFoamBox')}
                            fullWidth
                            variant="outlined"
                            value={formik.values.bigFoamBox === 0 ? '' : formik.values.bigFoamBox}
                            onChange={({ target }) => {
                                setChangeBox(true);
                                handlePackageChange('bigFoamBox', target.value);
                            }}
                            InputLabelProps={{ shrink: true }}
                            inputProps={{
                                inputMode: 'numeric',
                                pattern: '[0-9]*',
                                min: 1
                            }}
                        />
                    </GridTextField>
                    <GridTextField item xs={6} sm={4}>
                        <NoArrowTextField
                            type="number"
                            label={t('purchaseOrder.updateBoxSection.smallFoamBox')}
                            fullWidth
                            variant="outlined"
                            value={formik.values.smallFoamBox === 0 ? '' : formik.values.smallFoamBox}
                            onChange={({ target }) => {
                                setChangeBox(true);
                                handlePackageChange('smallFoamBox', target.value);
                            }}
                            InputLabelProps={{ shrink: true }}
                            inputProps={{
                                inputMode: 'numeric',
                                pattern: '[0-9]*',
                                min: 1
                            }}
                        />
                    </GridTextField>
                    <GridTextField item xs={6} sm={4}>
                        <NoArrowTextField
                            type="number"
                            label={t('purchaseOrder.updateBoxSection.phalanBox')}
                            fullWidth
                            variant="outlined"
                            value={formik.values.phalanBox === 0 ? '' : formik.values.phalanBox}
                            onChange={({ target }) => {
                                setChangeBox(true);
                                handlePackageChange('phalanBox', target.value);
                            }}
                            InputLabelProps={{ shrink: true }}
                            inputProps={{
                                inputMode: 'numeric',
                                pattern: '[0-9]*',
                                min: 1
                            }}
                        />
                    </GridTextField>
                    <GridTextField item xs={6} sm={4}>
                        <NoArrowTextField
                            type="number"
                            label={t('purchaseOrder.updateBoxSection.oasis')}
                            fullWidth
                            variant="outlined"
                            value={formik.values.oasis === 0 ? '' : formik.values.oasis}
                            onChange={({ target }) => {
                                setChangeBox(true);
                                handlePackageChange('oasis', target.value);
                            }}
                            InputLabelProps={{ shrink: true }}
                            inputProps={{
                                inputMode: 'numeric',
                                pattern: '[0-9]*',
                                min: 1
                            }}
                        />
                    </GridTextField>
                    <GridTextField item xs={6} sm={4}>
                        <NoArrowTextField
                            type="number"
                            label={t('purchaseOrder.updateBoxSection.bag')}
                            fullWidth
                            variant="outlined"
                            value={formik.values.bag === 0 ? '' : formik.values.bag}
                            onChange={({ target }) => {
                                setChangeBox(true);
                                handlePackageChange('bag', target.value);
                            }}
                            InputLabelProps={{ shrink: true }}
                            inputProps={{
                                inputMode: 'numeric',
                                pattern: '[0-9]*',
                                min: 1
                            }}
                        />
                    </GridTextField>
                    <GridTextField item xs={6} sm={4}>
                        <NoArrowTextField
                            type="number"
                            label={t('purchaseOrder.updateBoxSection.other')}
                            fullWidth
                            variant="outlined"
                            value={formik.values.other === 0 ? '' : formik.values.other}
                            onChange={({ target }) => {
                                setChangeBox(true);
                                handlePackageChange('other', target.value);
                            }}
                            InputLabelProps={{ shrink: true }}
                            inputProps={{
                                inputMode: 'numeric',
                                pattern: '[0-9]*',
                                min: 1
                            }}
                        />
                    </GridTextField>
                </Grid>
                {po?.dropOff.shippingMethod?.code === 'DELIVERY' && freights?.length === 0 ?
                    <Typography color="error">
                        {t('invoiceManagement.create.noFreightConfig', { supplier: po?.dropOff.supplier?.supplierName, province: po?.dropOff.province.nameTh })}
                    </Typography>
                    : <></>}
                <br />
                <Grid container spacing={1}>
                    <GridTextField item xs={12} sm={4}>
                        <Typography variant="subtitle1" fontWeight={600}>{t('purchaseOrder.deliverySection.image')}</Typography>
                    </GridTextField>
                    <GridTextField item xs={12} sm={12}>
                        <ThumbnailList pictures={po?.packagePics || []} />
                    </GridTextField>
                </Grid>
            </Wrapper>
            <Wrapper>
                <Grid container spacing={1}>
                    <GridTextField item xs={12} sm={3}>
                        <TextField
                            type="text"
                            label={t('invoiceManagement.column.invoiceDate')}
                            fullWidth
                            InputProps={{ readOnly: true }}
                            variant="outlined"
                            value={dayjs(po?.invoiceDate).format(DEFAULT_DATE_FORMAT)}
                            InputLabelProps={{ shrink: true }}
                        />
                    </GridTextField>
                    <GridTextField item xs={12} sm={3}>
                        {formik.values.dueDate ? (
                            <TextField
                                fullWidth
                                variant="outlined"
                                label={t('invoiceManagement.column.dueDate')}
                                value={dayjs(formik.values.dueDate).format(DEFAULT_DATE_FORMAT)}
                                InputLabelProps={{ shrink: true }}
                                InputProps={{
                                    readOnly: true,
                                }}
                            />
                        ) : (
                            <>
                                <DatePicker
                                    className={classes.datePickerFromTo}
                                    fullWidth
                                    disablePast
                                    inputVariant="outlined"
                                    InputLabelProps={{ shrink: true }}
                                    label={t('invoiceManagement.column.dueDate') + ' *'}
                                    name="dueDate"
                                    format={DEFAULT_DATE_FORMAT}
                                    value={formik.values.dueDate ?? today}
                                    onChange={(date) => {
                                        formik.setFieldValue('dueDate', date);
                                    }}
                                />

                                {formik.touched.dueDate && formik.errors.dueDate && (
                                    <Typography variant="caption" color="error">
                                        {formik.errors.dueDate}
                                    </Typography>
                                )}
                            </>
                        )}
                    </GridTextField>
                    <GridTextField item xs={12} sm={6}>
                        <TextField
                            type="text"
                            label={t('purchaseOrder.orderInformationSection.fields.labels.projectName')}
                            fullWidth
                            variant="outlined"
                            value={inputInvoiceHeader}
                            InputLabelProps={{ shrink: true }}
                            onChange={({ target }) => {
                                console.log('input : ' + target.value);
                                setInputInvoiceHeader(target.value);
                            }}
                        />
                    </GridTextField>
                </Grid>
                <Grid container spacing={1}>
                    <GridTextField item xs={12} sm={3}>
                        <Typography variant="subtitle1" fontWeight={600}>{t('purchaseOrder.productSection.title')}</Typography>
                    </GridTextField>
                    <GridTextField item xs={12} sm={9} sx={{ textAlign: 'right' }}>
                        {!isDownSm && (
                            <Stack direction="row" spacing={1} justifyContent="flex-end">
                                <Button
                                    variant="contained"
                                    startIcon={<LocalShipping />}
                                    sx={{
                                        '&.Mui-disabled': {
                                            backgroundColor: '#e0e0e0 !important',
                                            color: '#9e9e9e !important',
                                        },
                                    }}
                                    className="btn-emerald-green"
                                    onClick={handleAddFreightLine}
                                >
                                    {t('invoiceManagement.addFreight')}
                                </Button>
                            </Stack>
                        )}
                        {isDownSm && (
                            <Paper
                                elevation={3}
                                sx={{
                                    mt: 1,
                                    p: 1.5,
                                    borderRadius: 2,
                                    position: 'sticky',
                                    bottom: 8,
                                    zIndex: 10
                                }}
                            >
                                <Stack spacing={1}>
                                    <Button
                                        fullWidth
                                        variant="contained"
                                        startIcon={<LocalShipping />}
                                        sx={{
                                            '&.Mui-disabled': {
                                                backgroundColor: '#e0e0e0 !important',
                                                color: '#9e9e9e !important',
                                            },
                                        }}
                                        className="btn-emerald-green"
                                        onClick={handleAddFreightLine}
                                    >
                                        {t('invoiceManagement.addFreight')}
                                    </Button>
                                </Stack>
                            </Paper>)
                        }
                    </GridTextField>
                </Grid>
                <TableContainer>
                    <Table id="po_line_list__table">
                        <TableHead>
                            <TableRow>
                                <TableCell style={{ textAlign: 'center' }}>
                                    {t('purchaseOrder.productSection.fields.labels.name')}
                                </TableCell>
                                <TableCell style={{ textAlign: 'center', width: isMobileOnly ? '60px' : '95px' }}>
                                    {t('purchaseOrder.productSection.fields.labels.qty')}
                                </TableCell>
                                <TableCell style={{ textAlign: 'center', width: isMobileOnly ? '60px' : '100px' }}>
                                    {t('purchaseOrder.productSection.fields.labels.salePrice')}
                                </TableCell>
                                <TableCell align="center" width={60}></TableCell>
                            </TableRow>
                        </TableHead>
                        <TableBody>
                            {sortedPoLines.map((pol, index) => (
                                <TableRow key={pol.id}>
                                    {/* ================== ชื่อสินค้า ================== */}
                                    <TableCell>
                                        {pol.isManual ? (
                                            <TextField
                                                size="small"
                                                fullWidth
                                                value={pol.itemName}
                                                placeholder="ชื่อค่าระวาง"
                                                onChange={(e) => {
                                                    const updated = formik.values.poLines.map((line) =>
                                                        line.id === pol.id
                                                            ? { ...line, itemName: e.target.value }
                                                            : line
                                                    );
                                                    formik.setFieldValue("poLines", updated);
                                                }}
                                            />
                                        ) : (
                                            <Stack spacing={0.25}>
                                                <Stack direction="row" spacing={0.5} alignItems="center">
                                                    <Typography fontWeight={500}>
                                                        {pol.itemName}
                                                    </Typography>

                                                    {pol.isClaimed && (
                                                        <Chip
                                                            label="สินค้าเคลม"
                                                            size="small"
                                                            color="info"
                                                            sx={{ height: 18 }}
                                                        />
                                                    )}
                                                </Stack>

                                                <Typography
                                                    variant="caption"
                                                    color="text.secondary"
                                                    sx={{ fontSize: "10px" }}
                                                >
                                                    SKU: {pol.itemSku}
                                                </Typography>
                                            </Stack>
                                        )}
                                    </TableCell>

                                    {/* ================== จำนวน ================== */}
                                    <TableCell align="center">
                                        {editingQty[index] ? (
                                            <NoArrowTextField
                                                autoFocus
                                                value={pol.qty}
                                                type="number"
                                                size="small"
                                                onBlur={() => toggleEditQty(index)}
                                                inputProps={{ min: 1 }}
                                                sx={{ width: 90 }}
                                                disabled={pol.status === "CANCEL" || pol.isClaimed}
                                                onChange={(e) => {
                                                    const value = Number(e.target.value || 0);
                                                    const updated = formik.values.poLines.map((line) =>
                                                        line.id === pol.id ? { ...line, qty: value } : line
                                                    );
                                                    formik.setFieldValue("poLines", updated);
                                                }}
                                            />
                                        ) : (
                                            <Box sx={{ display: "flex", justifyContent: "center", gap: 0.5 }}>
                                                <Typography>{pol.qty}</Typography>
                                                {pol.status !== "CANCEL" && (
                                                    <IconButton size="small" onClick={() => toggleEditQty(index)}>
                                                        <Edit fontSize="small" />
                                                    </IconButton>
                                                )}
                                            </Box>
                                        )}
                                    </TableCell>

                                    {/* ================== ราคา ================== */}
                                    <TableCell>
                                        <NoArrowTextField
                                            type="number"
                                            size="small"
                                            value={pol.isClaimed ? "0" : pol.salesPrice || ""}
                                            disabled={pol.status === "CANCEL" || pol.isClaimed}
                                            sx={{ width: 80 }}
                                            onChange={(e) => {
                                                const value = Number(e.target.value || 0);
                                                const updated = formik.values.poLines.map((line) =>
                                                    line.id === pol.id ? { ...line, salesPrice: value } : line
                                                );
                                                formik.setFieldValue("poLines", updated);
                                            }}
                                            InputProps={{
                                                endAdornment: <InputAdornment position="end">฿</InputAdornment>,
                                            }}
                                        />
                                    </TableCell>

                                    {/* ================== ลบ ================== */}
                                    <TableCell align="center">
                                        {pol.isManual && (
                                            <IconButton
                                                color="error"
                                                size="small"
                                                onClick={() => handleRemoveLine(index)}
                                            >
                                                <Delete />
                                            </IconButton>
                                        )}
                                    </TableCell>
                                </TableRow>
                            ))}
                            <TableRow sx={{
                                '& td, & th': {
                                    borderBottom: 'none'
                                }
                            }}>
                                <TableCell style={{ textAlign: 'right' }} colSpan={2}>
                                    {t('invoiceManagement.subtotal')}
                                </TableCell>
                                <TableCell style={{ textAlign: 'center', width: isMobileOnly ? '60px' : '100px' }}>
                                    <Typography
                                        sx={{
                                            fontSize: 14,
                                            fontWeight: 500,
                                            textAlign: 'right',
                                            pr: 1
                                        }}
                                    >
                                        {subtotal.toLocaleString()} ฿
                                    </Typography>
                                </TableCell>
                                <TableCell align="center" width={60}></TableCell>
                            </TableRow>

                            <TableRow
                                sx={{
                                    '& td, & th': {
                                        borderBottom: 'none'
                                    }
                                }}
                            >
                                <TableCell style={{ textAlign: 'right' }} colSpan={2}>
                                    <Box
                                        sx={{
                                            display: 'flex',
                                            alignItems: 'center',
                                            justifyContent: 'flex-end',
                                            gap: 0.5
                                        }}
                                    >
                                        {t('invoiceManagement.discount')}
                                        <IconButton
                                            size="small"
                                            disabled
                                            onClick={() => {
                                                setDiscountInput(String(discount));
                                                setEditingDiscount(true);
                                            }}
                                        >
                                            <Edit fontSize="small" />
                                        </IconButton>
                                    </Box>
                                </TableCell>

                                <TableCell
                                    style={{
                                        textAlign: 'right',
                                        width: isMobileOnly ? '60px' : '100px'
                                    }}
                                >
                                    {editingDiscount ? (
                                        <NoArrowTextField
                                            autoFocus
                                            value={discountInput}
                                            type="text"
                                            size="small"
                                            inputProps={{
                                                inputMode: 'numeric',
                                                pattern: '[0-9]*'
                                            }}
                                            sx={{
                                                width: isMobileOnly ? 55 : 80,
                                                maxWidth: isMobileOnly ? 55 : 100,
                                                minWidth: isMobileOnly ? 55 : 78,
                                                '& input::-webkit-outer-spin-button, & input::-webkit-inner-spin-button': {
                                                    display: 'none'
                                                }
                                            }}
                                            onChange={(e) => {
                                                // กัน non-number
                                                const value = e.target.value.replace(/^0+(?=\d)/, '');
                                                setDiscountInput(value);
                                            }}
                                            onBlur={() => {
                                                const finalValue = Number(discountInput || 0);
                                                setApiDiscount(null);
                                                setDiscountInput(String(finalValue));
                                                setEditingDiscount(false);
                                            }}
                                            InputProps={{
                                                endAdornment: !isMobileOnly ? (
                                                    <InputAdornment position="end">฿</InputAdornment>
                                                ) : null
                                            }}
                                        />
                                    ) : (
                                        <Box
                                            sx={{
                                                display: 'flex',
                                                alignItems: 'center',
                                                justifyContent: 'flex-end',
                                                gap: 0.5
                                            }}
                                        >
                                            <Typography sx={{ fontSize: 14 }}>
                                                {discount.toLocaleString()} ฿
                                            </Typography>
                                        </Box>
                                    )}
                                </TableCell>

                                <TableCell align="center" width={60} />
                            </TableRow>

                            <TableRow sx={{
                                '& td, & th': {
                                    borderBottom: 'none'
                                }
                            }}>
                                <TableCell style={{ textAlign: 'right' }} colSpan={2}>
                                    {t('invoiceManagement.netAmount')}
                                </TableCell>
                                <TableCell style={{ textAlign: 'center', width: isMobileOnly ? '60px' : '100px' }}>
                                    <Typography
                                        sx={{
                                            fontSize: 14,
                                            fontWeight: 500,
                                            textAlign: 'right',
                                            pr: 1
                                        }}
                                    >
                                        {netAmount.toLocaleString()} ฿
                                    </Typography>
                                </TableCell>
                                <TableCell align="center" width={60}></TableCell>
                            </TableRow>

                            <TableRow>
                                <TableCell sx={{ borderBottom: 'none' }} />
                                <TableCell style={{ textAlign: 'right', width: isMobileOnly ? '80px' : '150px' }}>
                                    {t('invoiceManagement.grandTotal')}
                                </TableCell>
                                <TableCell style={{ textAlign: 'left', width: isMobileOnly ? '60px' : '100px' }}>
                                    <Typography
                                        sx={{
                                            fontSize: 14,
                                            fontWeight: 500,
                                            textAlign: 'right',
                                            pr: 1
                                        }}
                                    >
                                        {grandTotal.toLocaleString()} ฿
                                    </Typography>
                                </TableCell>
                                <TableCell align="center" width={60}></TableCell>
                            </TableRow>

                            <TableRow sx={{ '& td, & th': { borderBottom: 'none' } }}>
                                {/* column 1 */}
                                <TableCell colSpan={2}>
                                    <Box sx={{ display: 'flex', justifyContent: 'flex-end', alignItems: 'center', gap: 1 }}>
                                        <Checkbox
                                            size="small"
                                            checked={enableWithHoldingTax}
                                            onChange={(e) => {
                                                const checked = e.target.checked;
                                                setEnableWithHoldingTax(checked);
                                                if (!checked) {
                                                    setWithHoldingPercent(0);
                                                } else {
                                                    setWithHoldingPercent(3);
                                                }
                                            }
                                            }
                                        />

                                        <Typography sx={{ fontSize: 14 }}>
                                            {t('invoiceManagement.withHoldingTax')}
                                        </Typography>

                                        {enableWithHoldingTax && (
                                            <Select
                                                size="small"
                                                value={withHoldingPercent}
                                                onChange={(e) => setWithHoldingPercent(Number(e.target.value))}
                                                sx={{ ml: 1, minWidth: 90, height: 32 }}
                                            >
                                                {WITH_HOLDING_OPTIONS.map(p => (
                                                    <MenuItem key={p} value={p}>
                                                        {p}%
                                                    </MenuItem>
                                                ))}
                                            </Select>
                                        )}
                                    </Box>
                                </TableCell>
                                <TableCell
                                    style={{ textAlign: 'center', width: isMobileOnly ? '60px' : '100px' }}
                                >
                                    <Typography
                                        sx={{
                                            fontSize: 14,
                                            fontWeight: 500,
                                            textAlign: 'right',
                                            pr: 1,
                                            color: enableWithHoldingTax ? 'text.primary' : 'text.disabled'
                                        }}
                                    >
                                        {withHoldingAmount.toLocaleString()} ฿
                                    </Typography>
                                </TableCell>
                                <TableCell align="center" width={60} />
                            </TableRow>

                            <TableRow>
                                <TableCell sx={{ borderBottom: 'none' }} />
                                <TableCell style={{ textAlign: 'right', width: isMobileOnly ? '80px' : '150px' }}>
                                    {t('invoiceManagement.payAmount')}
                                </TableCell>
                                <TableCell style={{ textAlign: 'left', width: isMobileOnly ? '60px' : '100px' }}>
                                    <Typography
                                        sx={{
                                            fontSize: 14,
                                            fontWeight: 500,
                                            textAlign: 'right',
                                            pr: 1
                                        }}
                                    >
                                        {payAmount.toLocaleString()} ฿
                                    </Typography>
                                </TableCell>
                                <TableCell align="center" width={60}></TableCell>
                            </TableRow>
                        </TableBody>
                    </Table>
                </TableContainer>
            </Wrapper>
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
                            setTitle(t('message.confirmCloseTitle'));
                            setMsg(t('message.confirmCloseMsg'));
                            setAction('CLOSE');
                            setVisibleConfirmationDialog(true);
                        }}
                        variant="contained"
                        startIcon={<ArrowBack />}
                        className="btn-cool-grey">
                        {t('button.back')}
                    </Button>
                    <Button
                        fullWidth={isDownSm}
                        disabled={invoiceData?.paymentStatus === 'PAID' || invoiceData?.paymentStatus === 'OVERPAID'}
                        onClick={() => {
                            setTitle(t('message.confirmUpdateBillingTitle', { poId: po?.id }));
                            setMsg(t('message.confirmUpdateBillingMsg'));
                            setAction('SUBMIT');
                            setVisibleConfirmationDialog(true);
                        }}
                        variant="contained"
                        startIcon={<Save />}
                        className="btn-emerald-green"
                    >
                        {t('button.save')}
                    </Button>
                    <Button
                        fullWidth={isDownSm}
                        onClick={() => {
                            setViewTitle(t('invoiceManagement.invoiceNoTitle'));
                            setViewType('INVOICE');
                            setOpenViewOptionDialog(true);
                        }}
                        variant="contained"
                        startIcon={<Preview />}
                        className="btn-green-teal">
                        {t('invoiceManagement.viewInvoice')}
                    </Button>
                    <DownloadPOButton
                        po={invoiceData}
                        className='btn-baby-blue'
                        isDownSm={isDownSm}
                        label={t('invoiceManagement.downloadInvoice')}
                        downloadSaleOrderFunction={(invoiceData, format, options) => {
                            downloadInvoiceFunction(invoiceData, format, options);
                        }}
                    />

                    {invoiceData?.paymentStatus !== 'UNPAID' && (
                        <Button
                            fullWidth={isDownSm}
                            onClick={() => {
                                setViewTitle(t('billingManagement.viewBillingReceiptTitle'));
                                setViewType('RECEIPT');
                                setOpenViewOptionDialog(true);
                            }}
                            variant="contained"
                            startIcon={<Preview />}
                            className='btn-pastel-yellow'>
                            {t('invoiceManagement.createReceipt')}
                        </Button>
                    )}
                    {invoiceData?.invoiceStatus === 'DRAFT' && (
                        <Button
                            fullWidth={isDownSm}
                            onClick={() => {
                                setTitle(t('message.confirmCompleteInvoiceTitle', { invoiceNo: po?.invoiceNo }));
                                setMsg(t('message.confirmCompleteInvoiceMsg'));
                                setAction('COMPLETE');
                                setVisibleConfirmationDialog(true);
                            }}
                            disabled={!canFinish}
                            variant="contained"
                            startIcon={<Check />}
                            className="btn-emerald-green">
                            {t('button.finish')}
                        </Button>
                    )}
                </Stack>
            </Wrapper>
            <LoadingDialog
                open={openLoading}
            />
            <ConfirmDialog
                open={visibleConfirmationDialog}
                title={title}
                message={msg}
                confirmText={t('button.confirm')}
                cancelText={t('button.cancel')}
                onConfirm={() => {
                    if (action === 'SUBMIT') {
                        formik.handleSubmit();
                    } else if (action === 'CLOSE') {
                        formik.resetForm();
                        customerFormik.resetForm();
                        history.push('/invoice-management')
                    } else if (action === 'UPDATE_CUSTOMER') {
                        customerFormik.handleSubmit();
                    } else if (action === 'COMPLETE') {
                        completedInvoiceFunction(invoiceData.invoiceNo);
                    }
                    setVisibleConfirmationDialog(false);
                }}
                onCancel={() => setVisibleConfirmationDialog(false)}
                isShowCancelButton={true}
                isShowConfirmButton={true}
            />
            <ViewInvoiceDialog
                open={openViewDialog}
                url={pdfUrl}
                invNo={invNo}
                options={{ original: printOriginal, copy: printCopy }}
                type='INVOICE'
                onClose={() => setOpenViewDialog(false)}
            />
            <ViewOptionDialog
                open={openViewOptionDialog}
                title={viewTitle}
                onClose={() => setOpenViewOptionDialog(false)}
                onConfirm={(options) => {
                    setPrintCopy(options.copy);
                    setPrintOriginal(options.original);
                    if (viewType === 'INVOICE') {
                        viewInvoiceFunction(invoiceData, options)
                    } else if (viewType === 'RECEIPT') {
                        if (selectedReceipts) {
                            viewReceiptListFunction(invoiceData?.invoiceNo, selectedReceipts, options);
                        }
                    }
                    setOpenViewOptionDialog(false);
                }}
            >
                {viewType === 'RECEIPT' && (
                    <Box>
                        <Typography
                            variant="subtitle1"
                            fontWeight={600}
                        >
                            {t('billingManagement.receiptList')}
                        </Typography>

                        <FormGroup>
                            <Stack spacing={1}>
                                {invoiceData?.receipts
                                    .filter(item => item.receiptNo)
                                    .map(item => (
                                        <FormControlLabel
                                            key={item.receiptNo}
                                            control={
                                                <Checkbox
                                                    checked={selectedReceipts.includes(item.receiptNo)}
                                                    onChange={() =>
                                                        handleToggleReceipt(item.receiptNo)
                                                    }
                                                />
                                            }
                                            label={
                                                <Typography variant="body2">
                                                    {formatDateStringWithPattern(item.receiptDate, DEFAULT_DATE_FORMAT)}  ยอดเงิน  {formatMoney(item.amount)}
                                                </Typography>
                                            }
                                        />
                                    ))}
                            </Stack>
                        </FormGroup>
                    </Box>
                )}
            </ViewOptionDialog>
        </Page >
    );
}

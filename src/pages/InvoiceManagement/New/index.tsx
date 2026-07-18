import { ArrowBackIos, ReceiptLong } from '@mui/icons-material';
import {
  Button,
  Checkbox,
  FormControlLabel,
  Grid,
  Stack,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  TextField,
  Typography
} from '@mui/material';
import { makeStyles } from '@mui/styles';
import ConfirmDialog from 'components/ConfirmDialog';
import LoadingDialog from 'components/LoadingDialog';
import PageTitle from 'components/PageTitle';
import { GridSearchSection, Wrapper } from 'components/Styled';
import { Page } from 'layout/LayoutRoute';
import { ReactElement, useEffect, useMemo, useState } from 'react';
import toast from 'react-hot-toast';
import { useTranslation } from 'react-i18next';
import { useQuery } from 'react-query';
import { useHistory, useParams } from 'react-router-dom';
import { ROUTE_PATHS } from 'routes';
import { createInvoice } from 'services/Invoice/invoice-api';
import { getSalesOrderV1 } from 'services/SaleOrder/sale-order-api';
import { SalesOrderDetailV1, SalesOrderV1 } from 'services/SaleOrder/sale-order-type';
import { formatNumber } from 'utils/utils';

interface InvoiceCreateParams {
  salesOrderId: string;
}

interface InvoiceCreateDraft {
  docDate: string;
  dueDate: string;
  remark: string;
  subTotal: number;
  discount: number;
  isVat: boolean;
}

function toDateInput(value?: string | null): string {
  if (!value) {
    return '';
  }

  const parts = value.split('/');
  if (parts.length !== 3) {
    return value;
  }

  return `${parts[2]}-${parts[1]}-${parts[0]}`;
}

function createDraft(salesOrder?: SalesOrderV1): InvoiceCreateDraft {
  const today = new Date().toISOString().slice(0, 10);

  return {
    docDate: today,
    dueDate: toDateInput(salesOrder?.expireDate) || today,
    remark: salesOrder?.remark || '',
    subTotal: Number(salesOrder?.subTotal || 0),
    discount: Number(salesOrder?.discount || 0),
    isVat: Number(salesOrder?.vatRate || 0) > 0
  };
}

function getEmployeeName(salesOrder?: SalesOrderV1): string {
  const employee = salesOrder?.saleAccount;
  if (!employee) {
    return '-';
  }

  return (
    [employee.firstNameTh || employee.firstName, employee.lastNameTh || employee.lastName]
      .filter(Boolean)
      .join(' ')
      .trim() || '-'
  );
}

function getCustomerLabel(salesOrder?: SalesOrderV1): string {
  const customer = salesOrder?.customer as any;
  if (!customer) return '-';
  return (
    [customer.id ? `(${customer.id})` : '', customer.customerName || customer.companyName || '']
      .filter(Boolean)
      .join(' ') || '-'
  );
}

function getCustomerAddress(salesOrder?: SalesOrderV1): string {
  const source = salesOrder as any;
  const customer = source?.customer;
  const address =
    source?.customerAddress ||
    customer?.addresses?.find((item: any) => item.isDefault) ||
    customer?.addresses?.[0];
  return address?.fullAddress || '-';
}

function getCustomerContactName(salesOrder?: SalesOrderV1): string {
  const source = salesOrder as any;
  const customer = source?.customer;
  const contact =
    source?.customerContact ||
    customer?.contacts?.find((item: any) => item.isDefault) ||
    customer?.contacts?.[0];
  return contact?.contactName || '-';
}

function getCustomerContactNumber(salesOrder?: SalesOrderV1): string {
  const source = salesOrder as any;
  const customer = source?.customer;
  const contact =
    source?.customerContact ||
    customer?.contacts?.find((item: any) => item.isDefault) ||
    customer?.contacts?.[0];
  return contact?.contactNumber || '-';
}

function Summary({
  label,
  value,
  strong = false
}: {
  label: string;
  value: number;
  strong?: boolean;
}): ReactElement {
  return (
    <Stack direction="row" justifyContent="space-between" alignItems="center" spacing={2}>
      <Typography sx={{ color: '#475569', fontSize: 15, fontWeight: 700 }}>{label}</Typography>
      <Typography variant="body1" sx={{ fontWeight: strong ? 800 : 700, fontSize: 18 }}>
        {formatNumber(value || 0)}
      </Typography>
    </Stack>
  );
}

function SummaryInput({
  label,
  value,
  strong = false,
  onChange
}: {
  label: string;
  value: number;
  strong?: boolean;
  onChange: (value: number) => void;
}): ReactElement {
  return (
    <Stack direction="row" justifyContent="space-between" alignItems="center" spacing={2}>
      <Typography sx={{ color: '#475569', fontSize: 15, fontWeight: 700 }}>{label}</Typography>
      <TextField
        type="number"
        value={value}
        onChange={(event) => onChange(Number(event.target.value || 0))}
        sx={{
          width: { xs: '100%', sm: 220 },
          '& .MuiOutlinedInput-root': {
            minHeight: 52
          },
          '& .MuiInputBase-input': {
            textAlign: 'right',
            fontWeight: strong ? 800 : 700,
            fontSize: 18,
            py: 1.5
          }
        }}
      />
    </Stack>
  );
}

function Info({ label, value }: { label: string; value?: string | number | null }): ReactElement {
  return (
    <Stack spacing={0.25}>
      <Typography sx={{ color: '#64748b', fontSize: 12, fontWeight: 700 }}>{label}</Typography>
      <Typography
        variant="body2"
        sx={{ fontWeight: 500, whiteSpace: 'pre-wrap', wordBreak: 'break-word' }}>
        {value || '-'}
      </Typography>
    </Stack>
  );
}

export default function NewInvoice(): ReactElement {
  const { salesOrderId } = useParams<InvoiceCreateParams>();
  const history = useHistory();
  const { t } = useTranslation();
  const [draft, setDraft] = useState<InvoiceCreateDraft>(createDraft());
  const [isSaving, setIsSaving] = useState(false);
  const [isConfirmOpen, setIsConfirmOpen] = useState(false);
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
    specCell: {
      width: 360,
      maxWidth: 360,
      whiteSpace: 'normal',
      wordBreak: 'break-word'
    },
    fitContentCell: {
      width: 1,
      whiteSpace: 'nowrap'
    }
  });
  const classes = useStyles();

  const { data: salesOrder, isFetching } = useQuery(
    ['invoice-create-sales-order', salesOrderId],
    () => getSalesOrderV1(salesOrderId),
    {
      enabled: Boolean(salesOrderId),
      refetchOnWindowFocus: false
    }
  );

  useEffect(() => {
    setDraft(createDraft(salesOrder));
  }, [salesOrder]);

  const summary = useMemo(() => {
    const paymentTerm = salesOrder?.customer?.customerPaymentTerm.code;

    const subTotal = Number(draft.subTotal || 0);
    const discount = Number(draft.discount || 0);
    const remainingAmount = Math.max(subTotal - discount, 0);
    let depositAmount = 0;
    if (paymentTerm === 'DEP50') {
      depositAmount = (remainingAmount * 50) / 100;
    } else if (paymentTerm === 'DEP30_BBS') {
      depositAmount = (remainingAmount * 30) / 100;
    } else {
      depositAmount = remainingAmount;
    }
    const vat = draft.isVat ? depositAmount * 0.07 : 0;

    return {
      subTotal,
      discount,
      remainingAmount,
      depositAmount,
      vat,
      grandTotal: depositAmount + vat
    };
  }, [draft.discount, draft.isVat, draft.subTotal]);

  const handleSubmit = async () => {
    if (!salesOrder?.salesOrderNo) {
      return;
    }

    setIsSaving(true);
    try {
      const response = await toast.promise(
        createInvoice({
          salesOrderNo: salesOrder.salesOrderNo,
          docDate: draft.docDate || undefined,
          dueDate: draft.dueDate || undefined,
          remark: draft.remark?.trim() || undefined,
          subTotal: Number(draft.subTotal || 0),
          discount: Number(draft.discount || 0),
          amount: Number(summary.depositAmount || 0),
          vat: Number(summary.vat || 0),
          grandTotal: Number(summary.grandTotal || 0)
        }),
        {
          loading: t('toast.loading'),
          success: (result) => `${t('toast.success')} (${result.invoiceNo})`,
          error: t('toast.failed')
        }
      );

      setIsConfirmOpen(false);
      history.push(ROUTE_PATHS.INVOICE_DETAIL.replace(':id', response.invoiceNo));
      return response;
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <Page>
      <LoadingDialog open={isFetching || isSaving} />
      <PageTitle title={t('documentManagement.invoice.newInvoice')} />
      <Wrapper>
        <Stack
          direction={{ xs: 'column', sm: 'row' }}
          spacing={1}
          useFlexGap
          sx={{
            justifyContent: { sm: 'flex-end' },
            alignItems: { xs: 'stretch', sm: 'center' },
            mb: 2
          }}>
          <Button
            variant="contained"
            className="btn-emerald-green"
            startIcon={<ReceiptLong />}
            onClick={() => setIsConfirmOpen(true)}
            disabled={!salesOrder || isSaving}>
            {t('documentManagement.invoice.createInvoiceButton')}
          </Button>
          <Button
            variant="contained"
            className="btn-cool-grey"
            startIcon={<ArrowBackIos />}
            onClick={() =>
              history.push(
                salesOrder?.salesOrderNo
                  ? ROUTE_PATHS.SALE_ORDER_DETAIL.replace(':id', salesOrder.salesOrderNo)
                  : ROUTE_PATHS.SALE_ORDER_MANAGEMENT
              )
            }>
            {t('button.back')}
          </Button>
        </Stack>

        <Grid container spacing={2}>
          <Grid item xs={12} md={4}>
            <Stack spacing={1.25} className={classes.section}>
              <Typography variant="h6">{t('documentManagement.invoice.generalSection')}</Typography>
              <Info
                label={t('documentManagement.invoice.referenceSalesOrder')}
                value={salesOrder?.salesOrderNo}
              />
              <TextField
                type="date"
                label={t('documentManagement.invoice.docDate')}
                value={draft.docDate}
                onChange={(event) =>
                  setDraft((previous) => ({ ...previous, docDate: event.target.value }))
                }
                InputLabelProps={{ shrink: true }}
              />
              <TextField
                type="date"
                label={t('documentManagement.invoice.dueDate')}
                value={draft.dueDate}
                onChange={(event) =>
                  setDraft((previous) => ({ ...previous, dueDate: event.target.value }))
                }
                InputLabelProps={{ shrink: true }}
              />
              <Info
                label={t('documentManagement.invoice.currency')}
                value={salesOrder?.currency || 'THB'}
              />
            </Stack>
          </Grid>

          <Grid item xs={12} md={4}>
            <Stack spacing={1.25} className={classes.section}>
              <Typography variant="h6">
                {t('documentManagement.invoice.customerSection.title')}
              </Typography>
              <Info label={t('customerManagement.customer')} value={getCustomerLabel(salesOrder)} />
              <Info
                label={t('documentManagement.invoice.customerSection.address')}
                value={getCustomerAddress(salesOrder)}
              />
              <Info
                label={t('documentManagement.invoice.customerSection.contactName')}
                value={getCustomerContactName(salesOrder)}
              />
              <Info
                label={t('documentManagement.invoice.customerSection.contactNumber')}
                value={getCustomerContactNumber(salesOrder)}
              />
              <Info
                label="เงื่อนไขการชำระเงิน"
                value={salesOrder?.customer?.customerPaymentTerm?.nameTh}
              />
            </Stack>
          </Grid>

          <Grid item xs={12} md={4}>
            <Stack spacing={1.25} className={classes.section}>
              <Typography variant="h6">
                {t('documentManagement.invoice.salesSection.title')}
              </Typography>
              <Info
                label={t('documentManagement.invoice.salesSection.salesAccount')}
                value={getEmployeeName(salesOrder)}
              />
              <Info
                label={t('documentManagement.invoice.salesSection.coSalesAccount')}
                value={salesOrder?.coSaleId || '-'}
              />
              <FormControlLabel
                control={
                  <Checkbox
                    checked={draft.isVat}
                    disabled
                  // onChange={(event) =>
                  //   setDraft((previous) => ({
                  //     ...previous,
                  //     isVat: event.target.checked
                  //   }))
                  // }
                  />
                }
                label={draft.isVat ? 'มี VAT 7%' : 'ไม่มี VAT'}
                sx={{
                  m: 0,
                  '& .MuiFormControlLabel-label': {
                    fontSize: 15,
                    fontWeight: 700,
                    color: '#475569'
                  }
                }}
              />
            </Stack>
          </Grid>

          <Grid item xs={12}>
            <Stack spacing={1.25} className={classes.section}>
              <Typography variant="h6">{t('documentManagement.invoice.remark')}</Typography>
              <TextField
                multiline
                minRows={4}
                fullWidth
                value={draft.remark}
                onChange={(event) =>
                  setDraft((previous) => ({ ...previous, remark: event.target.value }))
                }
              />
            </Stack>
          </Grid>
        </Grid>

        <GridSearchSection container>
          <TableContainer>
            <Table>
              <TableHead>
                <TableRow>
                  <TableCell
                    align="center"
                    className={`${classes.tableHeader} ${classes.fitContentCell}`}>
                    #
                  </TableCell>
                  <TableCell className={`${classes.tableHeader} ${classes.fitContentCell}`}>
                    {t('documentManagement.invoice.itemSection.name')}
                  </TableCell>
                  <TableCell className={`${classes.tableHeader} ${classes.specCell}`}>
                    {t('documentManagement.invoice.itemSection.spec')}
                  </TableCell>
                  <TableCell
                    align="right"
                    className={`${classes.tableHeader} ${classes.fitContentCell}`}>
                    {t('documentManagement.invoice.itemSection.unitPrice')}
                  </TableCell>
                  <TableCell
                    align="right"
                    className={`${classes.tableHeader} ${classes.fitContentCell}`}>
                    {t('documentManagement.invoice.itemSection.quantity')}
                  </TableCell>
                  <TableCell
                    align="right"
                    className={`${classes.tableHeader} ${classes.fitContentCell}`}>
                    {t('documentManagement.invoice.itemSection.totalAmount')}
                  </TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {salesOrder?.items?.length ? (
                  salesOrder.items.map((item: SalesOrderDetailV1, index: number) => (
                    <TableRow key={item.id || index}>
                      <TableCell align="center" className={classes.fitContentCell}>
                        {item.lineNo || index + 1}
                      </TableCell>
                      <TableCell className={classes.fitContentCell}>{item.name || '-'}</TableCell>
                      <TableCell className={classes.specCell}>{item.spec || '-'}</TableCell>
                      <TableCell align="right" className={classes.fitContentCell}>
                        {formatNumber(item.unitPrice || 0)}
                      </TableCell>
                      <TableCell align="right" className={classes.fitContentCell}>
                        {formatNumber(item.quantity || 0)}
                      </TableCell>
                      <TableCell align="right" className={classes.fitContentCell}>
                        {formatNumber(item.amount || 0)}
                      </TableCell>
                    </TableRow>
                  ))
                ) : (
                  <TableRow>
                    <TableCell colSpan={6} align="center">
                      {t('warning.noResultList')}
                    </TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
          </TableContainer>
        </GridSearchSection>

        <GridSearchSection container spacing={2} justifyContent="flex-end">
          <Grid item xs={12} md={4}>
            <Stack spacing={1.25} className={classes.section}>
              <Typography variant="h5" sx={{ fontWeight: 800 }}>
                {t('documentManagement.invoice.summarySection.title')}
              </Typography>
              <Summary label="ยอดรวมทั้งสิ้น" value={summary.subTotal} />
              <SummaryInput
                label={t('documentManagement.invoice.summarySection.discount')}
                value={summary.discount}
                onChange={(value) =>
                  setDraft((previous) => ({
                    ...previous,
                    discount: value
                  }))
                }
              />
              <Summary
                label={t('documentManagement.invoice.summarySection.remainingAmount')}
                value={summary.remainingAmount}
              />
              <Summary
                label={t('documentManagement.invoice.summarySection.depositAmount')}
                value={summary.depositAmount}
              />
              <Summary
                label={t('documentManagement.invoice.summarySection.vat')}
                value={summary.vat}
              />
              <Summary
                label={t('documentManagement.invoice.summarySection.grandTotal')}
                value={summary.grandTotal}
                strong
              />
            </Stack>
          </Grid>
        </GridSearchSection>

        <ConfirmDialog
          open={isConfirmOpen}
          title={t('documentManagement.invoice.confirmCreateTitle')}
          message={t('documentManagement.invoice.confirmCreateMessage')}
          confirmText={t('button.confirm')}
          cancelText={t('button.cancel')}
          isShowCancelButton={true}
          isShowConfirmButton={true}
          onCancel={() => setIsConfirmOpen(false)}
          onConfirm={handleSubmit}
        />
      </Wrapper>
    </Page>
  );
}

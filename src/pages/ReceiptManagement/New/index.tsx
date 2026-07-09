import { ArrowBackIos, ReceiptLong } from '@mui/icons-material';
import {
  Button,
  Grid,
  MenuItem,
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
import { getInvoice } from 'services/Invoice/invoice-api';
import { InvoicePayment, InvoiceRecord } from 'services/Invoice/invoice-type';
import { createReceipt } from 'services/Receipt/receipt-api';
import { ReceiptType } from 'services/Receipt/receipt-type';
import { formatDate } from 'utils';
import { formatNumber } from 'utils/utils';

interface ReceiptCreateParams {
  invoiceId: string;
  paymentId: string;
}

interface ReceiptCreateDraft {
  receiptType: ReceiptType;
  docDate: string;
  remark: string;
}

const getTodayDateInputValue = () => new Date().toISOString().slice(0, 10);

function getDefaultReceiptType(invoice?: InvoiceRecord): ReceiptType {
  const hasVat = Number(invoice?.vatRate || 0) > 0;
  return hasVat ? 'DEPOSIT_TAX_INVOICE' : 'DEPOSIT_RECEIPT';
}

function getEmployeeName(invoice?: InvoiceRecord): string {
  const employee = invoice?.saleAccount;
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

function getCustomerLabel(invoice?: InvoiceRecord): string {
  const customer = invoice?.customer as any;
  if (!customer) return '-';
  return (
    [customer.id ? `(${customer.id})` : '', customer.customerName || customer.companyName || '']
      .filter(Boolean)
      .join(' ') || '-'
  );
}

function getCustomerAddress(invoice?: InvoiceRecord): string {
  const source = invoice as any;
  const customer = source?.customer;
  const address =
    source?.customerAddress ||
    customer?.addresses?.find((item: any) => item.isDefault) ||
    customer?.addresses?.[0];
  return address?.fullAddress || '-';
}

function getCustomerContactName(invoice?: InvoiceRecord): string {
  const source = invoice as any;
  const customer = source?.customer;
  const contact =
    source?.customerContact ||
    customer?.contacts?.find((item: any) => item.isDefault) ||
    customer?.contacts?.[0];
  return contact?.contactName || '-';
}

function getCustomerContactNumber(invoice?: InvoiceRecord): string {
  const source = invoice as any;
  const customer = source?.customer;
  const contact =
    source?.customerContact ||
    customer?.contacts?.find((item: any) => item.isDefault) ||
    customer?.contacts?.[0];
  return contact?.contactNumber || '-';
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

function paymentMethodLabel(payment?: InvoicePayment): string {
  if (!payment) return '-';
  switch (payment.paymentMethod) {
    case 'TRANSFER':
      return 'โอนเงิน';
    case 'CHEQUE':
      return 'เช็ค';
    case 'CASH':
      return 'เงินสด';
    default:
      return '-';
  }
}

function receiptTypeLabel(type: ReceiptType): string {
  switch (type) {
    case 'RECEIPT':
      return 'ใบเสร็จรับเงิน';
    case 'DEPOSIT_RECEIPT':
      return 'ใบรับเงินมัดจำ';
    case 'RECEIPT_TAX_INVOICE':
      return 'ใบเสร็จรับเงิน/ใบกำกับภาษี';
    case 'DEPOSIT_TAX_INVOICE':
      return 'ใบรับเงินมัดจำ/ใบกำกับภาษี';
    default:
      return type;
  }
}

export default function NewReceipt(): ReactElement {
  const { invoiceId, paymentId } = useParams<ReceiptCreateParams>();
  const history = useHistory();
  const { t } = useTranslation();
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

  const { data: invoice, isFetching } = useQuery(
    ['receipt-create-invoice', invoiceId],
    () => getInvoice(invoiceId),
    {
      enabled: Boolean(invoiceId),
      refetchOnWindowFocus: false
    }
  );

  const selectedPayment = useMemo(
    () => invoice?.payments?.find((payment) => String(payment.id) === paymentId),
    [invoice, paymentId]
  );

  const [draft, setDraft] = useState<ReceiptCreateDraft>({
    receiptType: 'DEPOSIT_RECEIPT',
    docDate: getTodayDateInputValue(),
    remark: ''
  });

  const computedReceiptType = draft.receiptType || getDefaultReceiptType(invoice);

  useEffect(() => {
    if (!invoice) {
      return;
    }

    setDraft((previous) => ({
      ...previous,
      receiptType: getDefaultReceiptType(invoice)
    }));
  }, [invoice]);

  const summary = useMemo(() => {
    const paymentAmount = Number(selectedPayment?.amount || 0);
    const vatRate = Number(invoice?.vatRate || 0);
    const isTaxInvoice =
      computedReceiptType === 'RECEIPT_TAX_INVOICE' ||
      computedReceiptType === 'DEPOSIT_TAX_INVOICE';

    if (isTaxInvoice && vatRate > 0) {
      const amount = paymentAmount / (1 + vatRate);
      const vat = paymentAmount - amount;
      return {
        subTotal: amount,
        discount: 0,
        amount,
        vat,
        grandTotal: paymentAmount
      };
    }

    return {
      subTotal: paymentAmount,
      discount: 0,
      amount: paymentAmount,
      vat: 0,
      grandTotal: paymentAmount
    };
  }, [computedReceiptType, invoice?.vatRate, selectedPayment?.amount]);

  const handleSubmit = async () => {
    if (!invoice?.invoiceNo || !selectedPayment?.id) {
      return;
    }

    setIsSaving(true);
    try {
      const response = await toast.promise(
        createReceipt({
          invoiceNo: invoice.invoiceNo,
          invoicePaymentId: selectedPayment.id,
          receiptType: computedReceiptType,
          docDate: draft.docDate || undefined,
          remark: draft.remark?.trim() || undefined
        }),
        {
          loading: t('toast.loading'),
          success: (result) => `${t('toast.success')} (${result.receiptNo})`,
          error: t('toast.failed')
        }
      );

      setIsConfirmOpen(false);
      history.push(ROUTE_PATHS.RECEIPT_DETAIL.replace(':id', response.receiptNo));
      return response;
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <Page>
      <LoadingDialog open={isFetching || isSaving} />
      <PageTitle title={t('documentManagement.receipt.newReceipt')} />
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
            disabled={!invoice || !selectedPayment || isSaving}>
            {t('documentManagement.receipt.createReceiptButton')}
          </Button>
          <Button
            variant="contained"
            className="btn-cool-grey"
            startIcon={<ArrowBackIos />}
            onClick={() =>
              history.push(
                invoice?.invoiceNo
                  ? ROUTE_PATHS.INVOICE_DETAIL.replace(':id', invoice.invoiceNo)
                  : ROUTE_PATHS.INVOICE_MANAGEMENT
              )
            }>
            {t('button.back')}
          </Button>
        </Stack>

        <Grid container spacing={2}>
          <Grid item xs={12} md={4}>
            <Stack spacing={1.25} className={classes.section}>
              <Typography variant="h6">{t('documentManagement.receipt.generalSection')}</Typography>
              <Info
                label={t('documentManagement.receipt.referenceInvoice')}
                value={invoice?.invoiceNo}
              />
              <TextField
                type="date"
                label={t('documentManagement.receipt.docDate')}
                value={draft.docDate}
                onChange={(event) =>
                  setDraft((previous) => ({ ...previous, docDate: event.target.value }))
                }
                InputLabelProps={{ shrink: true }}
              />
              <TextField
                select
                label={t('documentManagement.receipt.receiptType')}
                value={computedReceiptType}
                onChange={(event) =>
                  setDraft((previous) => ({
                    ...previous,
                    receiptType: event.target.value as ReceiptType
                  }))
                }>
                <MenuItem value="RECEIPT">ใบเสร็จรับเงิน</MenuItem>
                <MenuItem value="DEPOSIT_RECEIPT">ใบรับเงินมัดจำ</MenuItem>
                <MenuItem value="RECEIPT_TAX_INVOICE">ใบเสร็จรับเงิน/ใบกำกับภาษี</MenuItem>
                <MenuItem value="DEPOSIT_TAX_INVOICE">ใบรับเงินมัดจำ/ใบกำกับภาษี</MenuItem>
              </TextField>
              <Info
                label={t('documentManagement.receipt.currency')}
                value={invoice?.currency || 'THB'}
              />
            </Stack>
          </Grid>

          <Grid item xs={12} md={4}>
            <Stack spacing={1.25} className={classes.section}>
              <Typography variant="h6">
                {t('documentManagement.receipt.customerSection.title')}
              </Typography>
              <Info label={t('customerManagement.customer')} value={getCustomerLabel(invoice)} />
              <Info
                label={t('documentManagement.receipt.customerSection.address')}
                value={getCustomerAddress(invoice)}
              />
              <Info
                label={t('documentManagement.receipt.customerSection.contactName')}
                value={getCustomerContactName(invoice)}
              />
              <Info
                label={t('documentManagement.receipt.customerSection.contactNumber')}
                value={getCustomerContactNumber(invoice)}
              />
            </Stack>
          </Grid>

          <Grid item xs={12} md={4}>
            <Stack spacing={1.25} className={classes.section}>
              <Typography variant="h6">
                {t('documentManagement.receipt.paymentSection.title')}
              </Typography>
              <Info
                label={t('documentManagement.receipt.salesSection.salesAccount')}
                value={getEmployeeName(invoice)}
              />
              <Info
                label={t('documentManagement.receipt.paymentSection.paymentMethod')}
                value={paymentMethodLabel(selectedPayment)}
              />
              <Info
                label={t('documentManagement.receipt.paymentSection.paymentDate')}
                value={
                  selectedPayment?.paymentDate
                    ? formatDate(selectedPayment.paymentDate, 'DD/MM/YYYY')
                    : '-'
                }
              />
              <Info
                label={t('documentManagement.receipt.paymentSection.paymentAmount')}
                value={formatNumber(selectedPayment?.amount || 0)}
              />
              {selectedPayment?.paymentMethod === 'CHEQUE' ? (
                <Info
                  label={t('documentManagement.receipt.paymentSection.cheque')}
                  value={[
                    selectedPayment.chequeBank ? `ธนาคาร ${selectedPayment.chequeBank}` : null,
                    selectedPayment.chequeNo ? `เลขที่ ${selectedPayment.chequeNo}` : null,
                    selectedPayment.chequeDate
                      ? `วันที่ ${formatDate(selectedPayment.chequeDate, 'DD/MM/YYYY')}`
                      : null,
                    selectedPayment.chequeBranch ? `สาขา ${selectedPayment.chequeBranch}` : null
                  ]
                    .filter(Boolean)
                    .join(' | ')}
                />
              ) : null}
            </Stack>
          </Grid>

          <Grid item xs={12}>
            <Stack spacing={1.25} className={classes.section}>
              <Typography variant="h6">{t('documentManagement.receipt.remark')}</Typography>
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
                    {t('documentManagement.receipt.itemSection.name')}
                  </TableCell>
                  <TableCell className={`${classes.tableHeader} ${classes.specCell}`}>
                    {t('documentManagement.receipt.itemSection.spec')}
                  </TableCell>
                  <TableCell
                    align="right"
                    className={`${classes.tableHeader} ${classes.fitContentCell}`}>
                    {t('documentManagement.receipt.itemSection.unitPrice')}
                  </TableCell>
                  <TableCell
                    align="right"
                    className={`${classes.tableHeader} ${classes.fitContentCell}`}>
                    {t('documentManagement.receipt.itemSection.quantity')}
                  </TableCell>
                  <TableCell
                    align="right"
                    className={`${classes.tableHeader} ${classes.fitContentCell}`}>
                    {t('documentManagement.receipt.itemSection.totalAmount')}
                  </TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {invoice?.items?.length ? (
                  invoice.items.map((item, index) => (
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
                {t('documentManagement.receipt.summarySection.title')}
              </Typography>
              <Summary
                label={t('documentManagement.receipt.summarySection.subtotal')}
                value={summary.subTotal}
              />
              <Summary
                label={t('documentManagement.receipt.summarySection.discount')}
                value={summary.discount}
              />
              <Summary
                label={t('documentManagement.receipt.summarySection.amount')}
                value={summary.amount}
              />
              <Summary
                label={t('documentManagement.receipt.summarySection.vat')}
                value={summary.vat}
              />
              <Summary
                label={t('documentManagement.receipt.summarySection.grandTotal')}
                value={summary.grandTotal}
                strong
              />
            </Stack>
          </Grid>
        </GridSearchSection>
      </Wrapper>
      <ConfirmDialog
        open={isConfirmOpen}
        title={t('documentManagement.receipt.confirmCreateTitle')}
        message={`${t('documentManagement.receipt.confirmCreateMessage')} (${receiptTypeLabel(
          computedReceiptType
        )})`}
        isShowCancelButton
        isShowConfirmButton
        onCancel={() => setIsConfirmOpen(false)}
        onConfirm={handleSubmit}
      />
    </Page>
  );
}

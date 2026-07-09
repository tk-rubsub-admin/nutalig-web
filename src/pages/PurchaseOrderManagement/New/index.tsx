import { ArrowBackIos, AssignmentTurnedIn, DeleteOutline, FilePresent } from '@mui/icons-material';
import {
  Box,
  Button,
  Grid,
  ListSubheader,
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
import { ChangeEvent, ReactElement, useEffect, useMemo, useState } from 'react';
import toast from 'react-hot-toast';
import { useQuery } from 'react-query';
import { useHistory, useParams } from 'react-router-dom';
import { ROUTE_PATHS } from 'routes';
import { createPurchaseOrder } from 'services/PurchaseOrder/purchase-order-api';
import { getSalesOrderV1 } from 'services/SaleOrder/sale-order-api';
import { SalesOrderDetailV1, SalesOrderV1 } from 'services/SaleOrder/sale-order-type';
import { getSupplierById, getSupplierShippings } from 'services/Supplier/supplier-api';
import { formatNumber } from 'utils/utils';

interface PurchaseOrderCreateParams {
  salesOrderId: string;
}

interface PurchaseOrderCreateDraft {
  supplierId: string;
  supplierShippingId: string;
  docDate: string;
  productionLeadTimeDay: string;
  shippingLeadTimeDay: string;
  remark: string;
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

function createDraft(salesOrder?: SalesOrderV1): PurchaseOrderCreateDraft {
  const today = new Date().toISOString().slice(0, 10);
  const firstSupplierId = salesOrder?.items?.find((item) => item.supplier?.id)?.supplier?.id || '';
  return {
    supplierId: firstSupplierId,
    supplierShippingId: '',
    docDate: today,
    productionLeadTimeDay: '',
    shippingLeadTimeDay: '',
    remark: ''
  };
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

export default function NewPurchaseOrder(): ReactElement {
  const { salesOrderId } = useParams<PurchaseOrderCreateParams>();
  const history = useHistory();
  const [draft, setDraft] = useState<PurchaseOrderCreateDraft>(createDraft());
  const [attachments, setAttachments] = useState<File[]>([]);
  const [isSaving, setIsSaving] = useState(false);
  const [isConfirmOpen, setIsConfirmOpen] = useState(false);
  const useStyles = makeStyles({
    tableHeader: {
      border: '2px solid #e0e0e0',
      fontWeight: 'bold',
      paddingLeft: '14px',
      paddingRight: '14px',
      textAlign: 'center'
    },
    section: {
      backgroundColor: '#fff',
      border: '1px solid #e6ebf1',
      borderRadius: 12,
      padding: 20,
      boxShadow: '0 12px 30px rgba(15, 23, 42, 0.05)'
    },
    specCell: {
      width: 360,
      maxWidth: 360,
      whiteSpace: 'normal',
      wordBreak: 'break-word'
    },
    tableContainer: {
      border: '1px solid #e6ebf1',
      borderRadius: 10,
      overflow: 'hidden'
    },
    imageThumb: {
      width: 64,
      height: 64,
      borderRadius: 8,
      objectFit: 'cover',
      border: '1px solid #e2e8f0',
      backgroundColor: '#f8fafc',
      display: 'block'
    }
  });
  const classes = useStyles();

  const { data: salesOrder, isFetching } = useQuery(
    ['purchase-order-create-sales-order', salesOrderId],
    () => getSalesOrderV1(salesOrderId),
    {
      enabled: Boolean(salesOrderId),
      refetchOnWindowFocus: false
    }
  );

  const { data: supplierDetail, isFetching: isSupplierFetching } = useQuery(
    ['purchase-order-create-supplier', draft.supplierId],
    () => getSupplierById(draft.supplierId),
    {
      enabled: Boolean(draft.supplierId),
      refetchOnWindowFocus: false
    }
  );

  const {
    data: supplierShippings = [],
    isFetching: isSupplierShippingsFetching
  } = useQuery(['purchase-order-create-supplier-shippings'], () => getSupplierShippings(), {
    refetchOnWindowFocus: false
  });

  useEffect(() => {
    setDraft(createDraft(salesOrder));
  }, [salesOrder]);

  const availableSupplierShippings = useMemo(() => {
    const shippingType = (salesOrder?.shippingType || 'ALL').toUpperCase();
    if (shippingType === 'LAND') {
      return supplierShippings.filter((item) => item.shippingMethod === 'LAND');
    }
    if (shippingType === 'SEA') {
      return supplierShippings.filter((item) => item.shippingMethod === 'SEA');
    }
    return supplierShippings;
  }, [salesOrder?.shippingType, supplierShippings]);

  useEffect(() => {
    if (!availableSupplierShippings.length) {
      setDraft((previous) =>
        previous.supplierShippingId ? { ...previous, supplierShippingId: '' } : previous
      );
      return;
    }

    setDraft((previous) => {
      const isCurrentValid = availableSupplierShippings.some(
        (item) => String(item.id) === previous.supplierShippingId
      );
      if (isCurrentValid) {
        return previous;
      }
      return {
        ...previous,
        supplierShippingId: String(availableSupplierShippings[0].id)
      };
    });
  }, [availableSupplierShippings]);

  const supplierOptions = useMemo(() => {
    const map = new Map<string, { id: string; label: string }>();
    (salesOrder?.items || []).forEach((item) => {
      if (item.supplier?.id && !map.has(item.supplier.id)) {
        map.set(item.supplier.id, {
          id: item.supplier.id,
          label: item.supplier.supplierName || item.supplier.id
        });
      }
    });
    return Array.from(map.values());
  }, [salesOrder?.items]);

  const selectedShipping = useMemo(
    () =>
      availableSupplierShippings.find((item) => String(item.id) === draft.supplierShippingId) ||
      null,
    [availableSupplierShippings, draft.supplierShippingId]
  );

  const groupedSupplierShippings = useMemo(() => {
    const land = availableSupplierShippings.filter((item) => item.shippingMethod === 'LAND');
    const sea = availableSupplierShippings.filter((item) => item.shippingMethod === 'SEA');
    return { land, sea };
  }, [availableSupplierShippings]);

  useEffect(() => {
    if (!selectedShipping) {
      return;
    }
    setDraft((previous) => {
      if (previous.shippingLeadTimeDay) {
        return previous;
      }
      if (
        selectedShipping.leadTimeDayMax === null ||
        selectedShipping.leadTimeDayMax === undefined
      ) {
        return previous;
      }
      return {
        ...previous,
        shippingLeadTimeDay: String(selectedShipping.leadTimeDayMax)
      };
    });
  }, [selectedShipping]);

  const filteredItems = useMemo(() => {
    return (salesOrder?.items || []).filter(
      (item) =>
        item.supplier?.id === draft.supplierId &&
        (!selectedShipping || item.shippingMethod === selectedShipping.shippingMethod)
    );
  }, [draft.supplierId, salesOrder?.items, selectedShipping]);

  const summary = useMemo(() => {
    const subTotal = filteredItems.reduce(
      (sum, item) => sum + Number(item.supplierTotalUnitCost || 0) * Number(item.quantity || 0),
      0
    );
    const grandTotalThb = filteredItems.reduce(
      (sum, item) =>
        sum +
        Number(item.supplierTotalUnitCost || 0) *
        Number(item.quantity || 0) *
        Number(item.exchangeRate || 0),
      0
    );
    const currency = filteredItems[0]?.supplierCurrency || selectedShipping?.currency || '';
    const exchangeRate = filteredItems[0]?.exchangeRate || 0;
    return { subTotal, grandTotalThb, currency, exchangeRate };
  }, [filteredItems, selectedShipping?.currency]);

  const handleSubmit = async () => {
    if (!salesOrder?.salesOrderNo || !draft.supplierId || !draft.supplierShippingId) {
      toast.error('กรุณาเลือก Supplier และ Supplier Shipping');
      return;
    }
    if (!attachments.length) {
      toast.error('กรุณาอัปโหลดเอกสารอย่างน้อย 1 ไฟล์');
      return;
    }

    setIsSaving(true);
    try {
      const response = await toast.promise(
        createPurchaseOrder(
          {
            salesOrderNo: salesOrder.salesOrderNo,
            supplierId: draft.supplierId,
            supplierShippingId: Number(draft.supplierShippingId),
            docDate: draft.docDate,
            productionLeadTimeDay: draft.productionLeadTimeDay ? Number(draft.productionLeadTimeDay) : null,
            shippingLeadTimeDay: draft.shippingLeadTimeDay ? Number(draft.shippingLeadTimeDay) : null,
            remark: draft.remark
          },
          attachments
        ),
        {
          loading: 'กำลังสร้างใบสั่งซื้อ',
          success: 'สร้างใบสั่งซื้อสำเร็จ',
          error: 'สร้างใบสั่งซื้อไม่สำเร็จ'
        }
      );

      history.push(ROUTE_PATHS.PURCHASE_ORDER_DETAIL.replace(':id', response.purchaseOrderNo));
    } finally {
      setIsSaving(false);
      setIsConfirmOpen(false);
    }
  };

  const handleSelectAttachments = (event: ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(event.target.files || []);
    if (!files.length) {
      return;
    }
    setAttachments((previous) => [...previous, ...files]);
    event.target.value = '';
  };

  const handleRemoveAttachment = (index: number) => {
    setAttachments((previous) => previous.filter((_, itemIndex) => itemIndex !== index));
  };

  return (
    <Page>
      <LoadingDialog
        open={isFetching || isSupplierFetching || isSupplierShippingsFetching || isSaving}
      />
      <PageTitle title="สร้างใบสั่งซื้อ" />
      <Wrapper>
        <Stack
          direction={{ xs: 'column', sm: 'row' }}
          spacing={1}
          useFlexGap
          sx={{
            justifyContent: { sm: 'flex-end' },
            alignItems: { xs: 'stretch', sm: 'center' },
            mb: 2.5,
            px: { xs: 1, md: 1.5 }
          }}>
          <Button
            variant="contained"
            className="btn-emerald-green"
            startIcon={<AssignmentTurnedIn />}
            disabled={
              !salesOrder ||
              salesOrder.procurementStatus !== 'READY_FOR_PO' ||
              !draft.supplierId ||
              !draft.supplierShippingId ||
              !filteredItems.length ||
              !attachments.length
            }
            onClick={() => setIsConfirmOpen(true)}>
            สร้างใบสั่งซื้อ
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
            กลับ
          </Button>
        </Stack>

        <GridSearchSection
          container
          spacing={2.5}
          sx={{
            px: { xs: 1, md: 1.5 },
            pb: 1
          }}>
          <Grid item xs={12} md={6}>
            <BoxSection title="ข้อมูลใบสั่งซื้อ" classes={classes}>
              <Grid container spacing={2}>
                <Grid item xs={12} sm={6}>
                  <Info label="อ้างอิงใบยืนยันสั่งซื้อ" value={salesOrder?.salesOrderNo} />
                </Grid>
                <Grid item xs={12} sm={6}>
                  <Info label="สถานะจัดซื้อ" value={salesOrder?.procurementStatus || '-'} />
                </Grid>
                <Grid item xs={12} sm={12}>
                  <TextField
                    select
                    fullWidth
                    label="Supplier"
                    value={draft.supplierId}
                    InputLabelProps={{ shrink: true }}
                    onChange={(event) =>
                      setDraft((previous) => ({
                        ...previous,
                        supplierId: event.target.value
                      }))
                    }>
                    {supplierOptions.map((supplier) => (
                      <MenuItem key={supplier.id} value={supplier.id}>
                        {supplier.label}
                      </MenuItem>
                    ))}
                  </TextField>
                </Grid>
                <Grid item xs={12} sm={12}>
                  <TextField
                    select
                    fullWidth
                    label="Shipping"
                    value={draft.supplierShippingId}
                    InputLabelProps={{ shrink: true }}
                    onChange={(event) =>
                      setDraft((previous) => ({
                        ...previous,
                        supplierShippingId: event.target.value
                      }))
                    }
                    helperText={
                      !availableSupplierShippings.length
                        ? 'ไม่มี Shipping ที่ตรงกับประเภทการขนส่งของเอกสาร'
                        : undefined
                    }>
                    {groupedSupplierShippings.land.length ? (
                      <ListSubheader disableSticky>ทางรถ</ListSubheader>
                    ) : null}
                    {groupedSupplierShippings.land.map((shipping) => (
                      <MenuItem key={shipping.id} value={String(shipping.id)}>
                        {shipping.shippingName || `Shipping #${shipping.id}`}
                      </MenuItem>
                    ))}
                    {groupedSupplierShippings.sea.length ? (
                      <ListSubheader disableSticky>ทางเรือ</ListSubheader>
                    ) : null}
                    {groupedSupplierShippings.sea.map((shipping) => (
                      <MenuItem key={shipping.id} value={String(shipping.id)}>
                        {shipping.shippingName || `Shipping #${shipping.id}`}
                      </MenuItem>
                    ))}
                  </TextField>
                </Grid>
                <Grid item xs={12} sm={6}>
                  <TextField
                    fullWidth
                    type="date"
                    label="วันที่เอกสาร"
                    value={draft.docDate}
                    onChange={(event) =>
                      setDraft((previous) => ({ ...previous, docDate: event.target.value }))
                    }
                    InputLabelProps={{ shrink: true }}
                  />
                </Grid>
                <Grid item xs={12} sm={3}>
                  <TextField
                    fullWidth
                    type="number"
                    label="ระยะเวลาผลิต"
                    value={draft.productionLeadTimeDay}
                    onChange={(event) =>
                      setDraft((previous) => ({ ...previous, productionLeadTimeDay: event.target.value }))
                    }
                    inputProps={{ min: 0, step: 1 }}
                    InputLabelProps={{ shrink: true }}
                  />
                </Grid>
                <Grid item xs={12} sm={3}>
                  <TextField
                    fullWidth
                    type="number"
                    label="ระยะเวลาส่งของ"
                    value={draft.shippingLeadTimeDay}
                    onChange={(event) =>
                      setDraft((previous) => ({ ...previous, shippingLeadTimeDay: event.target.value }))
                    }
                    inputProps={{ min: 0, step: 1 }}
                    InputLabelProps={{ shrink: true }}
                  />
                </Grid>
                <Grid item xs={12}>
                  <TextField
                    fullWidth
                    multiline
                    minRows={3}
                    label="หมายเหตุ"
                    value={draft.remark}
                    onChange={(event) =>
                      setDraft((previous) => ({ ...previous, remark: event.target.value }))
                    }
                    InputLabelProps={{ shrink: true }}
                  />
                </Grid>
                <Grid item xs={12}>
                  <Typography variant="subtitle1" fontWeight={600}>
                    เอกสารแนบ
                  </Typography>
                  <Stack spacing={1.25} sx={{ mt: 1 }}>
                    <Box>
                      <Button
                        variant="contained"
                        className="btn-baby-blue"
                        component="label"
                        startIcon={<FilePresent />}
                        disabled={isSaving}>
                        อัปโหลดไฟล์
                        <input hidden type="file" multiple onChange={handleSelectAttachments} />
                      </Button>
                    </Box>
                    {attachments.length ? (
                      <Stack spacing={1}>
                        {attachments.map((file, index) => (
                          <Stack
                            key={`${file.name}-${index}`}
                            direction="row"
                            spacing={1}
                            alignItems="center"
                            justifyContent="space-between"
                            sx={{
                              px: 1.5,
                              py: 1.25,
                              border: '1px solid #dce4ee',
                              borderRadius: 2,
                              backgroundColor: '#fff'
                            }}>
                            <Typography sx={{ fontWeight: 500, wordBreak: 'break-word' }}>
                              {file.name}
                            </Typography>
                            <Button
                              variant="outlined"
                              color="error"
                              size="small"
                              startIcon={<DeleteOutline />}
                              onClick={() => handleRemoveAttachment(index)}>
                              ลบ
                            </Button>
                          </Stack>
                        ))}
                      </Stack>
                    ) : (
                      <Typography variant="body2" color="error">
                        กรุณาอัปโหลดเอกสารอย่างน้อย 1 ไฟล์
                      </Typography>
                    )}
                  </Stack>
                </Grid>
              </Grid>
            </BoxSection>
          </Grid>
          <Grid item xs={12} md={6}>
            <BoxSection title="สรุปยอด" classes={classes}>
              <Stack spacing={1.5}>
                <Info label="Supplier" value={supplierDetail?.supplierName || '-'} />
                <Info
                  label="Supplier Shipping"
                  value={
                    selectedShipping
                      ? `${selectedShipping.shippingMethod === 'SEA' ? 'ทางเรือ' : 'ทางรถ'} | ${selectedShipping.shippingName || `Shipping #${selectedShipping.id}`
                      }`
                      : '-'
                  }
                />
                <Info label="ผู้ติดต่อ" value={supplierDetail?.contactName || '-'} />
                <Info label="เบอร์ติดต่อ" value={supplierDetail?.contactNumber || '-'} />
                <Info label="ที่อยู่" value={supplierDetail?.fullAddress || '-'} />
                <Info
                  label="จุดส่งของ"
                  value={
                    selectedShipping?.destinations?.length
                      ? selectedShipping.destinations
                        .map((item) => item.destinationName || item.fullAddress || '-')
                        .join(', ')
                      : '-'
                  }
                />
                <Info label="สกุลเงิน" value={summary.currency || '-'} />
                <Info label="อัตราแลกเปลี่ยน" value={summary.exchangeRate || 0} />
                <Info
                  label="ยอดรวม"
                  value={`${formatNumber(summary.subTotal)} ${summary.currency || ''}`}
                />
                <Info label="ยอดรวม (บาท)" value={`${formatNumber(summary.grandTotalThb)} THB`} />
              </Stack>
            </BoxSection>
          </Grid>
          <Grid item xs={12}>
            <BoxSection title="รายการสินค้า" classes={classes}>
              <TableContainer className={classes.tableContainer}>
                <Table>
                  <TableHead>
                    <TableRow>
                      <TableCell className={classes.tableHeader}>รูปภาพ</TableCell>
                      <TableCell className={classes.tableHeader}>สินค้า</TableCell>
                      <TableCell className={classes.tableHeader}>รายละเอียด</TableCell>
                      <TableCell className={classes.tableHeader}>จำนวน</TableCell>
                      <TableCell className={classes.tableHeader}>ราคาสินค้า</TableCell>
                      <TableCell className={classes.tableHeader}>ค่าขนส่ง/หน่วย</TableCell>
                      <TableCell className={classes.tableHeader}>ต้นทุนรวม/หน่วย</TableCell>
                      <TableCell className={classes.tableHeader}>รวม</TableCell>
                      <TableCell className={classes.tableHeader}>รวม (บาท)</TableCell>
                    </TableRow>
                  </TableHead>
                  <TableBody>
                    {filteredItems.map((item) => (
                      <TableRow key={item.id}>
                        <TableCell align="center">
                          {item.imageUrl ? (
                            <Box
                              component="img"
                              src={item.imageUrl}
                              alt={item.name || 'product-image'}
                              className={classes.imageThumb}
                            />
                          ) : (
                            <Typography variant="caption" color="text.secondary">
                              -
                            </Typography>
                          )}
                        </TableCell>
                        <TableCell>{item.name || '-'}</TableCell>
                        <TableCell className={classes.specCell}>{item.spec || '-'}</TableCell>
                        <TableCell align="right">{formatNumber(item.quantity || 0)}</TableCell>
                        <TableCell align="right">
                          {formatNumber(item.supplierUnitPrice || 0)} {item.supplierCurrency || ''}
                        </TableCell>
                        <TableCell align="right">
                          {formatNumber(item.supplierShippingCost || 0)}{' '}
                          {item.supplierCurrency || ''}
                        </TableCell>
                        <TableCell align="right">
                          {formatNumber(item.supplierTotalUnitCost || 0)}{' '}
                          {item.supplierCurrency || ''}
                        </TableCell>
                        <TableCell align="right">
                          {formatNumber(
                            Number(item.supplierTotalUnitCost || 0) * Number(item.quantity || 0) ||
                            0
                          )}{' '}
                          {item.supplierCurrency || ''}
                        </TableCell>
                        <TableCell align="right">
                          {formatNumber(
                            Number(item.supplierTotalUnitCost || 0) *
                            Number(item.quantity || 0) *
                            Number(item.exchangeRate || 0) || 0
                          )}
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </TableContainer>
            </BoxSection>
          </Grid>
        </GridSearchSection>
      </Wrapper>

      <ConfirmDialog
        open={isConfirmOpen}
        title="ยืนยันสร้างใบสั่งซื้อ"
        message={`คุณต้องการสร้างใบสั่งซื้อจากใบยืนยันสั่งซื้อนี้ พร้อมเอกสารแนบ ${attachments.length} ไฟล์ ใช่หรือไม่`}
        isShowCancelButton
        isShowConfirmButton
        onCancel={() => setIsConfirmOpen(false)}
        onConfirm={handleSubmit}
      />
    </Page>
  );
}

function BoxSection({
  title,
  classes,
  children
}: {
  title: string;
  classes: Record<string, string>;
  children: ReactElement | ReactElement[];
}): ReactElement {
  return (
    <Stack className={classes.section} spacing={2.25}>
      <Typography variant="h6" sx={{ px: { xs: 0.5, md: 1 } }}>
        {title}
      </Typography>
      {children}
    </Stack>
  );
}

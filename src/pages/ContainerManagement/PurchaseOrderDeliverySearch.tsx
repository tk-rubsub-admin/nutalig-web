import { ExpandLess, ExpandMore, OpenInNew, Search } from '@mui/icons-material';
import {
  Alert,
  Box,
  Button,
  CircularProgress,
  Collapse,
  Grid,
  IconButton,
  MenuItem,
  Paper,
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
import { Fragment, FormEvent, useState } from 'react';
import { useQuery } from 'react-query';
import { Link } from 'react-router-dom';
import Paginate from 'components/Paginate';
import DeliveryContainerAssignment from 'components/DeliveryContainerAssignment';
import { ROUTE_PATHS } from 'routes';
import { getSupplierShippings } from 'services/Supplier/supplier-api';
import { searchPurchaseOrderDeliveries } from 'services/PurchaseOrder/purchase-order-delivery-api';
import { SearchPurchaseOrderDeliveryRequest } from 'services/PurchaseOrder/purchase-order-type';
import { getShippingMethodLabel } from 'utils/shipping';
import PurchaseOrderDeliveryItemsTable from 'pages/PurchaseOrderManagement/Detail/PurchaseOrderDeliveryItemsTable';
import DeliveryContainerDragBoard from './DeliveryContainerDragBoard';

const CONTAINER_STATUS_LABELS = {
  NOT_ASSIGNED: 'ยังไม่จัดตู้',
  PARTIALLY_ASSIGNED: 'จัดตู้บางส่วน',
  ASSIGNED: 'จัดตู้ครบแล้ว'
};
const SHIPPING_METHODS = [
  'SEA_FCL_20GP',
  'SEA_FCL_40HQ',
  'SEA_SHARE_FCL_20GP',
  'SEA_SHARE_FCL_40HQ'
];
const numberLabel = (value: number | null | undefined) =>
  value == null
    ? 'ข้อมูลไม่ครบ'
    : Number(value).toLocaleString('th-TH', { maximumFractionDigits: 6 });

export default function PurchaseOrderDeliverySearch() {
  const [draft, setDraft] = useState<SearchPurchaseOrderDeliveryRequest>({});
  const [filter, setFilter] = useState<SearchPurchaseOrderDeliveryRequest>({});
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);
  const [expandedId, setExpandedId] = useState<number | null>(null);
  const [validationError, setValidationError] = useState('');
  const { data, isFetching, isError, refetch } = useQuery(
    ['container-deliveries', filter, page, pageSize],
    () => searchPurchaseOrderDeliveries(filter, page, pageSize),
    { keepPreviousData: true, refetchOnWindowFocus: false }
  );
  const shippings = useQuery(['container-shippings'], getSupplierShippings, {
    refetchOnWindowFocus: false
  });
  const shippingLocations = (shippings.data || []).flatMap((shipping) =>
    (shipping.destinations || []).map((destination) => ({
      id: destination.id,
      label: shipping.shippingName
        ? `${shipping.shippingName} — ${destination.destinationName}`
        : destination.destinationName,
      shippingMethod: shipping.shippingMethod
    }))
  );
  const update = (key: keyof SearchPurchaseOrderDeliveryRequest, value: string) =>
    setDraft((current) => ({ ...current, [key]: value }));
  const search = (event: FormEvent) => {
    event.preventDefault();
    for (const [start, end] of [
      [draft.shippedDateStart, draft.shippedDateEnd],
      [draft.expectedWarehouseDateStart, draft.expectedWarehouseDateEnd]
    ]) {
      if (start && end && end < start) {
        setValidationError('วันที่สิ้นสุดต้องไม่ก่อนวันที่เริ่มต้น');
        return;
      }
    }
    setValidationError('');
    setExpandedId(null);
    setPage(1);
    if (page === 1 && JSON.stringify(filter) === JSON.stringify(draft)) void refetch();
    else setFilter({ ...draft });
  };
  const clear = () => {
    setDraft({});
    setFilter({});
    setPage(1);
    setValidationError('');
    setExpandedId(null);
    if (page === 1 && Object.keys(filter).length === 0) void refetch();
  };
  const records = data?.data.records || [];

  return (
    <Stack spacing={2}>
      <Paper variant="outlined" sx={{ p: 2 }}>
        <Box component="form" onSubmit={search}>
          <Grid container spacing={2}>
            {(
              [
                ['deliveryNo', 'เลขเที่ยวส่ง'],
                ['purchaseOrderNo', 'เลขที่ใบสั่งซื้อ (PO)']
              ] as const
            ).map(([key, label]) => (
              <Grid item xs={12} sm={6} md={3} key={key}>
                <TextField
                  fullWidth
                  label={label}
                  InputLabelProps={{ shrink: true }}
                  value={draft[key] || ''}
                  onChange={(event) => update(key, event.target.value)}
                />
              </Grid>
            ))}
            <Grid item xs={12} sm={6} md={3}>
              <TextField
                select
                fullWidth
                label="วิธีขนส่ง"
                value={draft.shippingMethod || ''}
                InputLabelProps={{ shrink: true }}
                onChange={(event) => update('shippingMethod', event.target.value)}>
                <MenuItem value="">ทั้งหมด</MenuItem>
                {SHIPPING_METHODS.map((method) => (
                  <MenuItem key={method} value={method}>
                    {getShippingMethodLabel(method)}
                  </MenuItem>
                ))}
              </TextField>
            </Grid>
            <Grid item xs={12} sm={6} md={3}>
              <TextField
                select
                fullWidth
                label="สถานะตู้"
                value={draft.containerStatus || ''}
                InputLabelProps={{ shrink: true }}
                onChange={(event) =>
                  setDraft((current) => ({
                    ...current,
                    containerStatus: (event.target.value ||
                      null) as SearchPurchaseOrderDeliveryRequest['containerStatus']
                  }))
                }>
                <MenuItem value="">ทั้งหมด</MenuItem>
                {Object.entries(CONTAINER_STATUS_LABELS).map(([value, label]) => (
                  <MenuItem key={value} value={value}>
                    {label}
                  </MenuItem>
                ))}
              </TextField>
            </Grid>
            <Grid item xs={12} sm={6} md={3}>
              <TextField
                select
                fullWidth
                label="สถานที่ขนส่ง"
                InputLabelProps={{ shrink: true }}
                value={draft.shippingLocationId ?? ''}
                disabled={shippings.isLoading || shippings.isError}
                helperText={shippings.isLoading ? 'กำลังโหลดสถานที่ขนส่ง' : undefined}
                onChange={(event) =>
                  setDraft((current) => ({
                    ...current,
                    shippingLocationId:
                      event.target.value === '' ? undefined : Number(event.target.value)
                  }))
                }>
                <MenuItem value="">ทั้งหมด</MenuItem>
                {shippingLocations.map((location) => (
                  <MenuItem key={location.id} value={location.id}>
                    {location.label}
                  </MenuItem>
                ))}
              </TextField>
            </Grid>
            <Grid item xs={12} md={6}>
              <TextField
                fullWidth
                label="คำค้นหา"
                InputLabelProps={{ shrink: true }}
                placeholder="เลขเที่ยวส่ง, PO, SO, Supplier, Tracking หรือสถานที่ขนส่ง"
                value={draft.keyword || ''}
                onChange={(event) => update('keyword', event.target.value)}
              />
            </Grid>
          </Grid>
          {validationError ? (
            <Alert severity="error" sx={{ mt: 2 }}>
              {validationError}
            </Alert>
          ) : null}
          <Stack direction="row" spacing={1} justifyContent="flex-end" sx={{ mt: 2 }}>
            <Button type="submit" variant="contained" startIcon={<Search />}>
              ค้นหา
            </Button>
            <Button onClick={clear}>เคลียร์</Button>
          </Stack>
        </Box>
      </Paper>
      {shippings.isError ? (
        <Alert
          severity="error"
          action={<Button onClick={() => void shippings.refetch()}>โหลดสถานที่อีกครั้ง</Button>}>
          ไม่สามารถโหลดสถานที่ขนส่งได้
        </Alert>
      ) : null}
      {isError ? (
        <Alert
          severity="error"
          action={<Button onClick={() => void refetch()}>ลองอีกครั้ง</Button>}>
          ไม่สามารถโหลดรายการเที่ยวส่งได้
        </Alert>
      ) : null}
      <TableContainer component={Paper} variant="outlined" aria-busy={isFetching}>
        <Table sx={{ minWidth: 1150 }} aria-label="รายการเที่ยวส่ง">
          <TableHead>
            <TableRow>
              <TableCell>เลขเที่ยวส่ง</TableCell>
              <TableCell>ใบสั่งซื้อ</TableCell>
              <TableCell>Supplier</TableCell>
              <TableCell>วิธีขนส่ง</TableCell>
              <TableCell>สถานที่ขนส่ง</TableCell>
              <TableCell>กล่อง</TableCell>
              <TableCell>CBM</TableCell>
              <TableCell>การจัดตู้</TableCell>
              <TableCell>ดำเนินการ</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {isFetching ? (
              <TableRow>
                <TableCell colSpan={12} align="center">
                  <CircularProgress size={28} aria-label="กำลังโหลดเที่ยวส่ง" />
                </TableCell>
              </TableRow>
            ) : null}
            {!isFetching &&
              !isError &&
              records.map((record) => (
                <Fragment key={record.id}>
                  <TableRow hover>
                    <TableCell>
                      <Typography variant="body2" fontWeight={600}>
                        {record.deliveryNo || '-'}
                      </Typography>
                      <Typography variant="caption">{record.trackingNumber || ''}</Typography>
                    </TableCell>
                    <TableCell>{record.purchaseOrderNo}</TableCell>
                    <TableCell>{record.supplierName || '-'}</TableCell>
                    <TableCell>{getShippingMethodLabel(record.shippingMethod)}</TableCell>
                    <TableCell>{record.shippingLocationName || '-'}</TableCell>
                    <TableCell>{numberLabel(record.totalCartons)}</TableCell>
                    <TableCell>{numberLabel(record.totalCbm)}</TableCell>
                    <TableCell>
                      <DeliveryContainerAssignment delivery={record} />
                    </TableCell>
                    <TableCell>
                      <IconButton
                        component={Link}
                        to={`${ROUTE_PATHS.PURCHASE_ORDER_DETAIL.replace(
                          ':id',
                          record.purchaseOrderNo || ''
                        )}?tab=delivery`}
                        aria-label={`เปิด PO ${record.purchaseOrderNo}`}>
                        <OpenInNew fontSize="small" />
                      </IconButton>
                      <IconButton
                        aria-label={`ดูรายละเอียด ${record.deliveryNo}`}
                        onClick={() => setExpandedId(expandedId === record.id ? null : record.id)}>
                        {expandedId === record.id ? <ExpandLess /> : <ExpandMore />}
                      </IconButton>
                    </TableCell>
                  </TableRow>
                  {expandedId === record.id ? (
                    <TableRow>
                      <TableCell colSpan={12} sx={{ p: 2 }}>
                        <Collapse in>
                          <PurchaseOrderDeliveryItemsTable delivery={record} />
                          {record.remark ? (
                            <Typography variant="body2" sx={{ mt: 1 }}>
                              หมายเหตุ: {record.remark}
                            </Typography>
                          ) : null}
                        </Collapse>
                      </TableCell>
                    </TableRow>
                  ) : null}
                </Fragment>
              ))}
            {!isFetching && !isError && !records.length ? (
              <TableRow>
                <TableCell colSpan={12} align="center" sx={{ py: 5 }}>
                  ไม่พบรายการเที่ยวส่งตามเงื่อนไข
                </TableCell>
              </TableRow>
            ) : null}
          </TableBody>
        </Table>
      </TableContainer>
      <Paginate
        pagination={data?.data.pagination}
        page={page}
        pageSize={pageSize}
        setPage={(next) => {
          setExpandedId(null);
          setPage(next);
        }}
        setPageSize={(next) => {
          setExpandedId(null);
          setPage(1);
          setPageSize(next);
        }}
        refetch={() => void refetch()}
        totalRecords={data?.data.pagination.totalRecords}
        isShow
      />
    </Stack>
  );
}

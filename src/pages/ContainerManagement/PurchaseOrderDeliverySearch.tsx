import { DisabledByDefault, ExpandLess, ExpandMore, OpenInNew, Search } from '@mui/icons-material';
import {
  Alert,
  Box,
  Button,
  Chip,
  Checkbox,
  Collapse,
  Grid,
  IconButton,
  InputAdornment,
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
import ListItemText from '@mui/material/ListItemText';
import { Fragment, FormEvent, useState } from 'react';
import { useQuery } from 'react-query';
import { Link, useHistory } from 'react-router-dom';
import Paginate from 'components/Paginate';
import { ListEmptyState, ListErrorState, ListLoadingState } from 'components/ManagementList';
import CollapsibleWrapper from 'components/CollapsibleWrapper';
import { GridSearchSection, GridTextField } from 'components/Styled';
import DeliveryContainerAssignment from 'components/DeliveryContainerAssignment';
import { ROUTE_PATHS } from 'routes';
import { getSupplierShippings } from 'services/Supplier/supplier-api';
import { searchPurchaseOrderDeliveries } from 'services/PurchaseOrder/purchase-order-delivery-api';
import {
  PurchaseOrderDeliveryRecord,
  SearchPurchaseOrderDeliveryRequest
} from 'services/PurchaseOrder/purchase-order-type';
import { getShippingMethodLabel } from 'utils/shipping';
import PurchaseOrderDeliveryItemsTable from 'pages/PurchaseOrderManagement/Detail/PurchaseOrderDeliveryItemsTable';
import { getCartonLabelLink, ReceiveMethodDialog } from 'pages/PurchaseOrderManagement/ReceiveList';

const CONTAINER_STATUS_LABELS = {
  NOT_ASSIGNED: 'ยังไม่จัดตู้',
  PARTIALLY_ASSIGNED: 'จัดตู้บางส่วน',
  ASSIGNED: 'จัดตู้ครบแล้ว'
};
const DELIVERY_STATUS_LABELS: Record<PurchaseOrderDeliveryRecord['status'], string> = {
  DRAFT: 'ฉบับร่าง',
  HANDED_OVER_TO_CARRIER: 'ส่งมอบให้ขนส่งแล้ว',
  IN_TRANSIT: 'อยู่ระหว่างขนส่ง',
  PARTIALLY_RECEIVED: 'รับเข้าบางส่วน',
  RECEIVED_AT_WAREHOUSE: 'รับเข้าคลังแล้ว',
  STORE_RECEIVE_CONFIRMED: 'ยืนยันรับเข้าคลังแล้ว',
  RECEIVED_WITH_ISSUE: 'รับแล้วมีปัญหา',
  CANCELLED: 'ยกเลิก'
};
const SHIPPING_METHODS = [
  'SEA_FCL_20GP',
  'SEA_FCL_40HQ',
  'SEA_SHARE_FCL_20GP',
  'SEA_SHARE_FCL_40HQ'
];
const PURCHASE_ORDER_NO_PREFIX = 'NTL-PO2026';
const numberLabel = (value: number | null | undefined) =>
  value == null
    ? 'ข้อมูลไม่ครบ'
    : Number(value).toLocaleString('th-TH', { maximumFractionDigits: 6 });

interface PurchaseOrderDeliverySearchProps {
  warehouseView?: boolean;
}

export default function PurchaseOrderDeliverySearch({
  warehouseView = false
}: PurchaseOrderDeliverySearchProps) {
  const [draft, setDraft] = useState<SearchPurchaseOrderDeliveryRequest>({});
  const [filter, setFilter] = useState<SearchPurchaseOrderDeliveryRequest>({});
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);
  const [expandedId, setExpandedId] = useState<number | null>(null);
  const [validationError, setValidationError] = useState('');
  const history = useHistory();
  const [receiveMethodDialogOpen, setReceiveMethodDialogOpen] = useState(false);
  const [dialogMode, setDialogMode] = useState<'choice' | 'camera' | 'manual'>('choice');
  const [manualLink, setManualLink] = useState('');
  const [manualLinkError, setManualLinkError] = useState('');
  const { data, isFetching, isError, refetch } = useQuery(
    ['container-deliveries', filter, page, pageSize],
    () => searchPurchaseOrderDeliveries(filter, page, pageSize),
    { keepPreviousData: true, refetchOnWindowFocus: false }
  );
  const shippings = useQuery(['container-shippings'], getSupplierShippings, {
    refetchOnWindowFocus: false,
    enabled: !warehouseView
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
  const normalizePurchaseOrderNo = (value: string) =>
    value.replace(new RegExp(`^${PURCHASE_ORDER_NO_PREFIX}`, 'i'), '').trim();
  const executeSearch = () => {
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
    const purchaseOrderNoSuffix = normalizePurchaseOrderNo(draft.purchaseOrderNo || '');
    const nextFilter = warehouseView
      ? {
        ...draft,
        purchaseOrderNo: purchaseOrderNoSuffix
          ? `${PURCHASE_ORDER_NO_PREFIX}${purchaseOrderNoSuffix}`
          : ''
      }
      : draft;
    if (page === 1 && JSON.stringify(filter) === JSON.stringify(nextFilter)) void refetch();
    else setFilter(nextFilter);
  };
  const search = (event: FormEvent) => {
    event.preventDefault();
    executeSearch();
  };
  const clear = () => {
    setDraft({});
    setFilter({});
    setPage(1);
    setValidationError('');
    setExpandedId(null);
    if (page === 1 && Object.keys(filter).length === 0) void refetch();
  };
  const openReceiveDialog = () => {
    setReceiveMethodDialogOpen(true);
    setDialogMode('choice');
    setManualLink('');
    setManualLinkError('');
  };
  const closeReceiveDialog = () => {
    setReceiveMethodDialogOpen(false);
    setDialogMode('choice');
    setManualLink('');
    setManualLinkError('');
  };
  const openCartonLabelLink = (value: string) => {
    const link = getCartonLabelLink(value);
    if (!link) {
      setManualLinkError('กรุณาระบุลิงก์ QR ใบแปะข้างกล่องที่ถูกต้อง');
      return;
    }
    closeReceiveDialog();
    history.push(link);
  };
  const records = data?.data.records || [];

  return (
    <Stack spacing={2}>
      <Stack
        direction={{ xs: 'column', sm: 'row' }}
        spacing={1}
        useFlexGap
        sx={{
          justifyContent: { sm: 'flex-end' },
          alignItems: { xs: 'stretch', sm: 'center' }
        }}>
        <Button
          fullWidth={false}
          variant="contained"
          className="btn-indigo-blue"
          startIcon={<Search />}
          onClick={executeSearch}>
          ค้นหา
        </Button>
        <Button
          fullWidth={false}
          variant="contained"
          className="btn-amber-orange"
          startIcon={<DisabledByDefault />}
          onClick={clear}>
          ล้าง
        </Button>
      </Stack>
      <CollapsibleWrapper title="ค้นหาเที่ยวส่ง" defaultExpanded={false}>
        <Box component="form" onSubmit={search}>
          <GridSearchSection container spacing={1} sx={{ mt: 0 }}>
            {(
              [
                ['deliveryNo', 'เลขเที่ยวส่ง'],
                ['purchaseOrderNo', 'เลขที่ใบสั่งซื้อ (PO)']
              ] as const
            ).map(([key, label]) => (
              <GridTextField item xs={12} sm={6} md={3} key={key}>
                <TextField
                  fullWidth
                  label={label}
                  InputLabelProps={{ shrink: true }}
                  value={
                    warehouseView && key === 'purchaseOrderNo'
                      ? normalizePurchaseOrderNo(draft[key] || '')
                      : draft[key] || ''
                  }
                  onChange={(event) =>
                    update(
                      key,
                      warehouseView && key === 'purchaseOrderNo'
                        ? normalizePurchaseOrderNo(event.target.value)
                        : event.target.value
                    )
                  }
                  InputProps={
                    warehouseView && key === 'purchaseOrderNo'
                      ? {
                        startAdornment: (
                          <InputAdornment position="start">
                            {PURCHASE_ORDER_NO_PREFIX}
                          </InputAdornment>
                        )
                      }
                      : undefined
                  }
                />
              </GridTextField>
            ))}
            {warehouseView ? (
              <GridTextField item xs={12} sm={6} md={3}>
                <TextField
                  select
                  SelectProps={{
                    multiple: true, renderValue: (selected) =>
                      (selected as string[]).map((value) => DELIVERY_STATUS_LABELS[value as PurchaseOrderDeliveryRecord['status']]).join(', ')
                  }}
                  fullWidth
                  label="สถานะเที่ยวส่ง"
                  value={draft.statuses || []}
                  InputLabelProps={{ shrink: true }}
                  onChange={(event) =>
                    setDraft((current) => ({
                      ...current,
                      statuses: typeof event.target.value === 'string'
                        ? event.target.value.split(',') as PurchaseOrderDeliveryRecord['status'][]
                        : event.target.value as PurchaseOrderDeliveryRecord['status'][]
                    }))
                  }>
                  {Object.entries(DELIVERY_STATUS_LABELS).map(([value, label]) => (
                    <MenuItem key={value} value={value}>
                      <Checkbox checked={(draft.statuses || []).includes(value as PurchaseOrderDeliveryRecord['status'])} />
                      <ListItemText primary={label} />
                    </MenuItem>
                  ))}
                </TextField>
              </GridTextField>
            ) : null}
            {!warehouseView ? <GridTextField item xs={12} sm={6} md={3}>
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
            </GridTextField> : null}
            {!warehouseView ? <GridTextField item xs={12} sm={6} md={3}>
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
            </GridTextField> : null}
            {!warehouseView ? <GridTextField item xs={12} sm={6} md={3}>
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
            </GridTextField> : null}
            <GridTextField item xs={12} md={6}>
              <TextField
                fullWidth
                label="คำค้นหา"
                InputLabelProps={{ shrink: true }}
                placeholder="เลขเที่ยวส่ง, PO, SO, Supplier, Tracking หรือสถานที่ขนส่ง"
                value={draft.keyword || ''}
                onChange={(event) => update('keyword', event.target.value)}
              />
            </GridTextField>
          </GridSearchSection>
          {validationError ? (
            <Alert severity="error" sx={{ mt: 2 }}>
              {validationError}
            </Alert>
          ) : null}
        </Box>
      </CollapsibleWrapper>
      {!warehouseView && shippings.isError ? (
        <Alert
          severity="error"
          action={<Button onClick={() => void shippings.refetch()}>โหลดสถานที่อีกครั้ง</Button>}>
          ไม่สามารถโหลดสถานที่ขนส่งได้
        </Alert>
      ) : null}
      {isError ? (
        <ListErrorState
          message="ไม่สามารถโหลดรายการเที่ยวส่งได้"
          onRetry={() => void refetch()}
        />
      ) : null}
      <TableContainer component={Paper} variant="outlined" aria-busy={isFetching}>
        <Table sx={{ minWidth: warehouseView ? 800 : 1150 }} aria-label="รายการเที่ยวส่ง">
          <TableHead>
            <TableRow>
              <TableCell>เลขเที่ยวส่ง</TableCell>
              <TableCell>Supplier</TableCell>
              <TableCell>วิธีขนส่ง</TableCell>
              <TableCell>สถานะ</TableCell>
              {!warehouseView ? <TableCell>สถานที่ขนส่ง</TableCell> : null}
              <TableCell>กล่อง</TableCell>
              {!warehouseView ? <TableCell>CBM</TableCell> : null}
              {!warehouseView ? <TableCell>การจัดตู้</TableCell> : null}
              <TableCell>ดำเนินการ</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {isFetching ? (
              <ListLoadingState colSpan={warehouseView ? 6 : 9} />
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
                    <TableCell>{record.supplierName || '-'}</TableCell>
                    <TableCell>{getShippingMethodLabel(record.shippingMethod)}</TableCell>
                    <TableCell>
                      <Chip
                        size="small"
                        label={DELIVERY_STATUS_LABELS[record.status] || record.status || '-'}
                      />
                    </TableCell>
                    {!warehouseView ? <TableCell>{record.shippingLocationName || '-'}</TableCell> : null}
                    <TableCell>{numberLabel(record.totalCartons)}</TableCell>
                    {!warehouseView ? <TableCell>{numberLabel(record.totalCbm)}</TableCell> : null}
                    {!warehouseView ? <TableCell><DeliveryContainerAssignment delivery={record} /></TableCell> : null}
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
                      <TableCell colSpan={warehouseView ? 6 : 9} sx={{ p: 2 }}>
                        <Collapse in>
                          <PurchaseOrderDeliveryItemsTable
                            delivery={record}
                            warehouseView={warehouseView}
                            onReceive={warehouseView ? openReceiveDialog : undefined}
                          />
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
              <ListEmptyState colSpan={warehouseView ? 6 : 9} message="ไม่พบรายการเที่ยวส่งตามเงื่อนไข" />
            ) : null}
          </TableBody>
        </Table>
      </TableContainer>
      {warehouseView ? (
        <ReceiveMethodDialog
          open={receiveMethodDialogOpen}
          mode={dialogMode}
          manualLink={manualLink}
          manualLinkError={manualLinkError}
          onModeChange={(mode) => {
            setDialogMode(mode);
            setManualLinkError('');
          }}
          onManualLinkChange={(value) => {
            setManualLink(value);
            setManualLinkError('');
          }}
          onBack={() => {
            setDialogMode('choice');
            setManualLinkError('');
          }}
          onClose={closeReceiveDialog}
          onSubmitManual={() => openCartonLabelLink(manualLink)}
          onScan={(value) => openCartonLabelLink(value)}
        />
      ) : null}
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
